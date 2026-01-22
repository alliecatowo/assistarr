import { gateway } from "@ai-sdk/gateway";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  deleteUserAIConfig,
  getUserAIConfigs,
  upsertUserAIConfig,
} from "@/lib/db/queries/user-ai-config";
import type { UserAIConfig } from "@/lib/db/schema";

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

  try {
    switch (providerName) {
      case "openrouter": {
        const openrouter = createOpenRouter({ apiKey });
        // Just test if the provider can be created and make a simple models request
        const response = await fetch("https://openrouter.ai/api/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!response.ok) {
          return {
            success: false,
            error: "Invalid OpenRouter API key",
          };
        }
        break;
      }
      case "gateway": {
        // For gateway, we can't easily test without making a model call
        // Just verify the key format
        if (!apiKey || apiKey.length < 10) {
          return {
            success: false,
            error: "Invalid AI Gateway API key format",
          };
        }
        break;
      }
      case "openai": {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!response.ok) {
          return {
            success: false,
            error: "Invalid OpenAI API key",
          };
        }
        break;
      }
      case "anthropic": {
        // Anthropic doesn't have a simple test endpoint
        // Check key format
        if (!apiKey.startsWith("sk-ant-")) {
          return {
            success: false,
            error: "Invalid Anthropic API key format (should start with sk-ant-)",
          };
        }
        break;
      }
      case "google": {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
        );
        if (!response.ok) {
          return {
            success: false,
            error: "Invalid Google AI API key",
          };
        }
        break;
      }
      default:
        return { success: false, error: "Unknown provider" };
    }

    return { success: true, latency: Date.now() - startTime };
  } catch (error) {
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
  } catch (error) {
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

    // Test the connection first
    const testResult = await testAIProviderConnection(
      body.providerName,
      body.apiKey
    );
    if (!testResult.success) {
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

    return NextResponse.json({
      ...config,
      apiKey: maskApiKey(config.apiKey),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
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

    return NextResponse.json({ success: true });
  } catch (error) {
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
    return "••••••••";
  }
  return `${apiKey.slice(0, 4)}••••••••${apiKey.slice(-4)}`;
}
