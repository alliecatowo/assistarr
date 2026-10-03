import { createAnthropic } from "@ai-sdk/anthropic";
import { createGateway, gateway } from "@ai-sdk/gateway";
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
import { isDemoMode, shouldUseScriptedModel } from "../demo/mode";
import { scriptedModel } from "../demo/scripted-model";
import { env, getAIProvider } from "../env";
import { ChatSDKError } from "../errors";
import { getModelForTier, type ModelTier } from "./models";

const DEMO_MODEL_ID =
  process.env.DEMO_MODEL_ID ?? "google/gemini-2.5-flash-lite";
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
      return createGateway({ apiKey: config.apiKey });
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

const NATIVE_PROVIDER_PREFIX: Record<string, string> = {
  openai: "openai/",
  anthropic: "anthropic/",
  google: "google/",
};

/**
 * True when the user's own key can serve this model. Aggregators (OpenRouter,
 * the AI Gateway) serve any model id; direct providers only their own models.
 */
export function isModelServedByUserConfig(
  modelId: string,
  config: Pick<UserAIConfig, "providerName">
): boolean {
  if (
    config.providerName === "openrouter" ||
    config.providerName === "gateway"
  ) {
    return true;
  }
  const prefix = NATIVE_PROVIDER_PREFIX[config.providerName];
  return Boolean(prefix) && modelId.startsWith(prefix);
}

/**
 * Get a model from a user-provided config. Never falls back to the app's own
 * key: a user who supplied a key either gets that key or an error.
 */
function getModelFromUserConfig(modelId: string, config: UserAIConfig) {
  const provider = createProviderFromUserConfig(config);

  if (!(provider && isModelServedByUserConfig(modelId, config))) {
    throw new ChatSDKError(
      "bad_request:api",
      "The selected model is not available with your API key. Pick a model from your provider."
    );
  }

  switch (config.providerName) {
    case "openai":
    case "anthropic":
    case "google":
      return provider(
        modelId.slice(NATIVE_PROVIDER_PREFIX[config.providerName].length)
      );
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

  if (shouldUseScriptedModel()) {
    return scriptedModel;
  }

  // Public demo with a real key: pin a cheap model, ignore the user's choice.
  if (isDemoMode()) {
    return getModelFromSystemProvider(DEMO_MODEL_ID);
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
  if (shouldUseScriptedModel()) {
    return scriptedModel;
  }
  if (isDemoMode()) {
    return getModelFromSystemProvider(DEMO_MODEL_ID);
  }
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  return getModelFromSystemProvider("google/gemini-2.5-flash");
}

/**
 * Get the artifact model (uses system keys)
 */
export function getArtifactModel() {
  if (shouldUseScriptedModel()) {
    return scriptedModel;
  }
  if (isDemoMode()) {
    return getModelFromSystemProvider(DEMO_MODEL_ID);
  }
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
