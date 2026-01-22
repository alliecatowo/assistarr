// Curated list of top models from Vercel AI Gateway
export const DEFAULT_CHAT_MODEL = "google/gemini-2.5-flash";

// =============================================================================
// Model Tiers - Quality/Speed tradeoff presets
// =============================================================================

export const MODEL_TIERS = {
  lite: {
    name: "Lite",
    description: "Fast responses, lower cost - great for simple tasks",
    models: {
      google: "google/gemini-2.5-flash-lite",
      anthropic: "anthropic/claude-haiku-4.5",
      openai: "openai/gpt-4.1-mini",
    },
    default: "google/gemini-2.5-flash-lite",
  },
  fast: {
    name: "Fast",
    description: "Balanced speed and quality - recommended for most tasks",
    models: {
      google: "google/gemini-2.5-flash",
      anthropic: "anthropic/claude-sonnet-4.5",
      openai: "openai/gpt-4.1-mini",
    },
    default: "google/gemini-2.5-flash",
  },
  heavy: {
    name: "Heavy",
    description: "Best quality, slower - for complex reasoning tasks",
    models: {
      google: "google/gemini-2.5-pro",
      anthropic: "anthropic/claude-opus-4.5",
      openai: "openai/gpt-5.2",
    },
    default: "google/gemini-2.5-pro",
  },
  thinking: {
    name: "Thinking",
    description: "Extended reasoning - for complex multi-step problems",
    models: {
      anthropic: "anthropic/claude-3.7-sonnet-thinking",
    },
    default: "anthropic/claude-3.7-sonnet-thinking",
  },
} as const;

export type ModelTier = keyof typeof MODEL_TIERS;
export const MODEL_TIER_OPTIONS: ModelTier[] = [
  "lite",
  "fast",
  "heavy",
  "thinking",
];

/**
 * Get the model ID for a specific tier and provider
 */
export function getModelForTier(tier: ModelTier, provider?: string): string {
  const tierConfig = MODEL_TIERS[tier];

  if (provider) {
    const providerKey =
      provider.toLowerCase() as keyof typeof tierConfig.models;
    if (providerKey in tierConfig.models) {
      return tierConfig.models[providerKey as keyof typeof tierConfig.models];
    }
  }

  return tierConfig.default;
}

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
};

export const chatModels: ChatModel[] = [
  // Anthropic
  {
    id: "anthropic/claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    description: "Fast and affordable, great for everyday tasks",
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    description: "Best balance of speed, intelligence, and cost",
  },
  {
    id: "anthropic/claude-opus-4.5",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    description: "Most capable Anthropic model",
  },
  // OpenAI
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "openai",
    description: "Fast and cost-effective for simple tasks",
  },
  {
    id: "openai/gpt-5.2",
    name: "GPT-5.2",
    provider: "openai",
    description: "Most capable OpenAI model",
  },
  // Google
  {
    id: "google/gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "google",
    description: "Ultra fast and affordable",
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    description: "Fast and capable with 1M context",
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "google",
    description: "Balanced performance and reasoning",
  },
  {
    id: "google/gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    provider: "google",
    description: "Most capable Google model",
  },
  // Reasoning models (extended thinking)
  {
    id: "anthropic/claude-3.7-sonnet-thinking",
    name: "Claude 3.7 Sonnet",
    provider: "reasoning",
    description: "Extended thinking for complex problems",
  },
];

// Group models by provider for UI
export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);
