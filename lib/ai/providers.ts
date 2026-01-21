import { gateway } from "@ai-sdk/gateway";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

const THINKING_SUFFIX_REGEX = /-thinking$/;

/**
 * Available AI providers
 * - "openrouter": Uses OpenRouter API (requires OPENROUTER_API_KEY)
 * - "gateway": Uses Vercel AI Gateway (requires Vercel credits)
 */
export type AIProvider = "openrouter" | "gateway";

/**
 * Get the configured AI provider from environment
 * Defaults to "openrouter" if OPENROUTER_API_KEY is set, otherwise "gateway"
 */
export function getConfiguredProvider(): AIProvider {
  const envProvider = process.env.AI_PROVIDER?.toLowerCase();

  // Explicit configuration takes precedence
  if (envProvider === "openrouter" || envProvider === "gateway") {
    return envProvider;
  }

  // Auto-detect based on available keys
  if (process.env.OPENROUTER_API_KEY) {
    return "openrouter";
  }

  return "gateway";
}

/**
 * OpenRouter provider instance (created lazily)
 */
let openrouterInstance: ReturnType<typeof createOpenRouter> | null = null;

function getOpenRouter() {
  if (!openrouterInstance) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENROUTER_API_KEY is required when using OpenRouter provider"
      );
    }
    openrouterInstance = createOpenRouter({
      apiKey,
    });
  }
  return openrouterInstance;
}

/**
 * Get a language model from the configured provider
 */
function getModelFromProvider(modelId: string) {
  const provider = getConfiguredProvider();

  if (provider === "openrouter") {
    return getOpenRouter()(modelId);
  }

  return gateway.languageModel(modelId);
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

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  if (isReasoningModel) {
    const baseModelId = modelId.replace(THINKING_SUFFIX_REGEX, "");

    return wrapLanguageModel({
      model: getModelFromProvider(baseModelId),
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    });
  }

  return getModelFromProvider(modelId);
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  return getModelFromProvider("google/gemini-2.5-flash");
}

export function getArtifactModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model");
  }
  return getModelFromProvider("google/gemini-2.5-flash");
}
