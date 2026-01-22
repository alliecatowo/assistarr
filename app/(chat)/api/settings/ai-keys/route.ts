import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  deleteUserAIConfig,
  getUserAIConfigs,
  upsertUserAIConfig,
} from "@/lib/db/queries/user-ai-config";
import { logger } from "@/lib/logger";
import { HEALTH_CHECK_TIMEOUT_MS } from "@/lib/plugins/core/client";

/**
 * Fetch with timeout for API key validation.
 * Uses HEALTH_CHECK_TIMEOUT_MS (10s) as these are quick validation calls.
 */
async function fetchWithTimeout(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    HEALTH_CHECK_TIMEOUT_MS
  );

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      logger.warn(
        { url, timeout: HEALTH_CHECK_TIMEOUT_MS },
        "AI provider test request timed out"
      );
      throw new Error(`Request timed out after ${HEALTH_CHECK_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Supported AI providers
export const AI_PROVIDERS = [
  {
    name: "OpenRouter",
    providerName: "openrouter",
    description: "Access multiple AI models through a single API",
    placeholder: "sk-or-...",
    docsUrl: "https://openrouter.ai/keys",
  },
  {
    name: "Vercel AI Gateway",
    providerName: "gateway",
    description: "Unified gateway for AI providers (requires Vercel credits)",
    placeholder: "Enter your AI Gateway API key",
    docsUrl: "https://vercel.com/docs/ai-sdk/ai-sdk-gateway",
  },
  {
    name: "OpenAI",
    providerName: "openai",
    description: "GPT-4, GPT-4o, and other OpenAI models",
    placeholder: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    name: "Anthropic",
    providerName: "anthropic",
    description: "Claude 3.5, Claude 3, and other Anthropic models",
    placeholder: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    name: "Google AI",
    providerName: "google",
    description: "Gemini 2.0, Gemini 1.5, and other Google models",
    placeholder: "AIza...",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
] as const;

const aiKeySchema = z.object({
  providerName: z.enum([
    "openrouter",
    "gateway",
    "openai",
    "anthropic",
    "google",
  ]),
  apiKey: z.string().min(1),
  isEnabled: z.boolean().optional(),
});

/**
 * Test if an API key is valid by making a simple API call
 */
async function testAIProviderConnection(
  providerName: string,
  apiKey: string
): Promise<{ success: boolean; error?: string; latency?: number }> {
  const startTime = Date.now();

  logger.debug({ providerName }, "Testing AI provider connection");

  try {
    switch (providerName) {
      case "openrouter": {
        const _openrouter = createOpenRouter({ apiKey });
        // Just test if provider can be created and make a simple models request
        const response = await fetchWithTimeout(
          "https://openrouter.ai/api/v1/models",
          {
            headers: { Authorization: `Bearer ${apiKey}` },
          }
        );
        if (!response.ok) {
          logger.warn(
            { providerName, status: response.status },
            "OpenRouter API key validation failed"
          );
          return {
            success: false,
            error: "Invalid OpenRouter API key",
          };
        }
        logger.info(
          { providerName, latency: Date.now() - startTime },
          "OpenRouter API key validated"
        );
        break;
      }
      case "gateway": {
        // For gateway, we can't easily test without making a model call
        // Just verify key format
        if (!apiKey || apiKey.length < 10) {
          return {
            success: false,
            error: "Invalid AI Gateway API key format",
          };
        }
        break;
      }
      case "openai": {
        const response = await fetchWithTimeout(
          "https://api.openai.com/v1/models",
          {
            headers: { Authorization: `Bearer ${apiKey}` },
          }
        );
        if (!response.ok) {
          logger.warn(
            { providerName, status: response.status },
            "OpenAI API key validation failed"
          );
          return {
            success: false,
            error: "Invalid OpenAI API key",
          };
        }
        logger.info(
          { providerName, latency: Date.now() - startTime },
          "OpenAI API key validated"
        );
        break;
      }
      case "anthropic": {
        // Anthropic doesn't have a simple test endpoint
        // Check key format
        if (!apiKey.startsWith("sk-ant-")) {
          return {
            success: false,
            error:
              "Invalid Anthropic API key format (should start with sk-ant-)",
          };
        }
        break;
      }
      case "google": {
        const response = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
        );
        if (!response.ok) {
          logger.warn(
            { providerName, status: response.status },
            "Google AI API key validation failed"
          );
          return {
            success: false,
            error: "Invalid Google AI API key",
          };
        }
        logger.info(
          { providerName, latency: Date.now() - startTime },
          "Google AI API key validated"
        );
        break;
      }
      default:
        return { success: false, error: "Unknown provider" };
    }

    return { success: true, latency: Date.now() - startTime };
  } catch (error) {
    logger.error({ error, providerName }, "AI provider connection test failed");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

// GET - List all user AI configs
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const configs = await getUserAIConfigs({ userId: session.user.id });
    // Mask API keys in response
    const maskedConfigs = configs.map((config) => ({
      ...config,
      apiKey: maskApiKey(config.apiKey),
    }));
    return NextResponse.json(maskedConfigs);
  } catch (_error) {
    logger.error(
      { error: _error, userId: session?.user?.id },
      "Failed to get AI configurations"
    );
    return NextResponse.json(
      { error: "Failed to get AI configurations" },
      { status: 500 }
    );
  }
}

// POST - Save AI config (upsert)
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const body = aiKeySchema.parse(json);

    // Test connection first
    const testResult = await testAIProviderConnection(
      body.providerName,
      body.apiKey
    );
    if (!testResult.success) {
      logger.warn(
        { providerName: body.providerName, error: testResult.error },
        "AI config test failed"
      );
      return NextResponse.json(
        { error: testResult.error || "Invalid API key" },
        { status: 400 }
      );
    }

    const config = await upsertUserAIConfig({
      userId: session.user.id,
      providerName: body.providerName,
      apiKey: body.apiKey,
      isEnabled: body.isEnabled ?? true,
    });

    logger.info(
      { userId: session.user.id, providerName: body.providerName },
      "AI config saved"
    );

    return NextResponse.json({
      ...config,
      apiKey: maskApiKey(config.apiKey),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    logger.error(
      { error, userId: session?.user?.id },
      "Failed to save AI configuration"
    );
    return NextResponse.json(
      { error: "Failed to save AI configuration" },
      { status: 500 }
    );
  }
}

// PUT - Test connection only (does not save)
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const body = aiKeySchema.parse(json);

    const testResult = await testAIProviderConnection(
      body.providerName,
      body.apiKey
    );

    if (!testResult.success) {
      return NextResponse.json(
        { success: false, error: testResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Connection successful",
      latency: testResult.latency,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid data" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to test connection" },
      { status: 500 }
    );
  }
}

// DELETE - Remove AI config
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const providerName = searchParams.get("providerName");

    if (!providerName) {
      return NextResponse.json(
        { error: "Provider name required" },
        { status: 400 }
      );
    }

    await deleteUserAIConfig({
      userId: session.user.id,
      providerName,
    });

    logger.info({ userId: session.user.id, providerName }, "AI config deleted");

    return NextResponse.json({ success: true });
  } catch (_error) {
    logger.error(
      { error: _error, userId: session?.user?.id },
      "Failed to delete AI configuration"
    );
    return NextResponse.json(
      { error: "Failed to delete AI configuration" },
      { status: 500 }
    );
  }
}

/**
 * Mask an API key for display (show first 4 and last 4 characters)
 */
function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 12) {
    return "•••••••••••";
  }
  return `${apiKey.slice(0, 4)}••••••••${apiKey.slice(-4)}`;
}
