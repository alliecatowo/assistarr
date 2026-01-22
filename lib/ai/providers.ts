import { createAnthropic } from "@ai-sdk/anthropic";
import { gateway } from "@ai-sdk/gateway";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";
import type { UserAIConfig } from "../db/schema";
import { env, getAIProvider } from "../env";
import { getModelForTier, type ModelTier } from "./models";

const THINKING_SUFFIX_REGEX = /-thinking$/;

/**
 * Available AI providers
 * - "openrouter": Uses OpenRouter API (requires OPENROUTER_API_KEY)
 * - "gateway": Uses Vercel AI Gateway (requires Vercel credits)
 * - "openai": Uses OpenAI directly
 * - "anthropic": Uses Anthropic directly
 * - "google": Uses Google AI directly
 */
export type AIProvider =
  | "openrouter"
  | "gateway"
  | "openai"
  | "anthropic"
  | "google";

/**
 * Get the configured AI provider from environment
 * Defaults to "openrouter" if OPENROUTER_API_KEY is set, otherwise "gateway"
 */
export function getConfiguredProvider(): AIProvider {
  return getAIProvider();
}

/**
 * Lazily created provider instances (for default/system keys)
 */
let openrouterInstance: ReturnType<typeof createOpenRouter> | null = null;

function getOpenRouter() {
  if (!openrouterInstance) {
    const apiKey = env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY is required when using OpenRouter provider"
      );
    }
    openrouterInstance = createOpenRouter({ apiKey });
  }
  return openrouterInstance;
}

/**
 * Create a provider instance from user config
 */
function createProviderFromUserConfig(config: UserAIConfig) {
  switch (config.providerName) {
    case "openrouter":
      return createOpenRouter({ apiKey: config.apiKey });
    case "gateway":
      // Gateway doesn't support custom keys, fall through to system
      return null;
    case "openai":
      return createOpenAI({ apiKey: config.apiKey });
    case "anthropic":
      return createAnthropic({ apiKey: config.apiKey });
    case "google":
      return createGoogleGenerativeAI({ apiKey: config.apiKey });
    default:
      return null;
  }
}

/**
 * Get a model from a user-provided config
 */
function getModelFromUserConfig(modelId: string, config: UserAIConfig) {
  const provider = createProviderFromUserConfig(config);

  if (!provider) {
    // Fall back to system provider
    return getModelFromSystemProvider(modelId);
  }

  // Map model IDs to provider-specific formats if needed
  switch (config.providerName) {
    case "openrouter":
      // OpenRouter uses the same model IDs
      return provider(modelId);
    case "openai":
      // Map common model names to OpenAI-specific IDs
      if (modelId.includes("gpt")) {
        return provider(modelId.replace("openai/", ""));
      }
      // For non-OpenAI models, fall back to system
      return getModelFromSystemProvider(modelId);
    case "anthropic":
      // Map common model names to Anthropic-specific IDs
      if (modelId.includes("claude")) {
        return provider(modelId.replace("anthropic/", ""));
      }
      // For non-Anthropic models, fall back to system
      return getModelFromSystemProvider(modelId);
    case "google":
      // Map common model names to Google-specific IDs
      if (modelId.includes("gemini")) {
        return provider(modelId.replace("google/", ""));
      }
      // For non-Google models, fall back to system
      return getModelFromSystemProvider(modelId);
    default:
      return provider(modelId);
  }
}

/**
 * Get a model from the system provider (app's default keys)
 */
function getModelFromSystemProvider(modelId: string) {
  const provider = getConfiguredProvider();

  if (provider === "openrouter") {
    return getOpenRouter()(modelId);
  }

  return gateway.languageModel(modelId);
}

/**
 * Get a language model, optionally using a user's own API key
 */
function getModelFromProvider(modelId: string, userConfig?: UserAIConfig) {
  if (userConfig) {
    return getModelFromUserConfig(modelId, userConfig);
  }
  return getModelFromSystemProvider(modelId);
}

// Test environment mock provider
export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : null;

/**
 * Get a language model for chat, optionally using user's own API key
 */
export function getLanguageModel(modelId: string, userConfig?: UserAIConfig) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  if (isReasoningModel) {
    const baseModelId = modelId.replace(THINKING_SUFFIX_REGEX, "");

    return wrapLanguageModel({
      model: getModelFromProvider(baseModelId, userConfig),
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    });
  }

  return getModelFromProvider(modelId, userConfig);
}

/**
 * Get the title generation model (uses system keys)
 */
export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  return getModelFromSystemProvider("google/gemini-2.5-flash");
}

/**
 * Get the artifact model (uses system keys)
 */
export function getArtifactModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model");
  }
  return getModelFromSystemProvider("google/gemini-2.5-flash");
}

/**
 * Check if a user has their own AI configuration
 */
export function hasUserAIConfig(userConfig?: UserAIConfig): boolean {
  return !!userConfig && userConfig.isEnabled;
}

/**
 * Get a language model based on user's preferred tier
 * Falls back to 'fast' tier if not specified
 */
export function getLanguageModelForTier(userConfig?: UserAIConfig) {
  const tier: ModelTier =
    (userConfig?.preferredModelTier as ModelTier) ?? "fast";
  const provider = userConfig?.providerName;
  const modelId = getModelForTier(tier, provider);
  return getLanguageModel(modelId, userConfig);
}

// Re-export getModelForTier for convenience
export { getModelForTier, type ModelTier } from "./models";
