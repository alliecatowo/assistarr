import { auth, type UserType } from "@/app/(auth)/auth";
import { getEntitlements } from "@/lib/ai/entitlements";
import { chatModels, MODEL_TIERS } from "@/lib/ai/models";
import { isModelServedByUserConfig } from "@/lib/ai/providers";
import { getClientIp } from "@/lib/client-ip";
import { isTestEnvironment } from "@/lib/constants";
import {
  getActiveUserAIConfig,
  getMessageCountByUserId,
} from "@/lib/db/queries/index";
import type { UserAIConfig } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import { createPerMinuteRateLimiter, RateLimiter } from "@/lib/rate-limit";

// Quota is also bound to the client IP, so minting fresh guest accounts does
// not mint fresh quota. Multiplier leaves room for a household behind one NAT.
const IP_QUOTA_MULTIPLIER = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const ipLimiters = new Map<string, RateLimiter>();

function getIpLimiter(windowMs: number, maxRequests: number): RateLimiter {
  const key = `${windowMs}:${maxRequests}`;
  let limiter = ipLimiters.get(key);
  if (!limiter) {
    limiter = new RateLimiter({ windowMs, maxRequests });
    ipLimiters.set(key, limiter);
  }
  return limiter;
}

const systemModelIds = new Set<string>([
  ...chatModels.map((m) => m.id),
  ...Object.values(MODEL_TIERS).flatMap((t) => Object.values(t.models)),
]);

/** Models the app's own key may be spent on. */
export function isAllowedSystemModel(modelId: string): boolean {
  return isTestEnvironment || systemModelIds.has(modelId);
}

export type SessionUser = {
  id: string;
  type: UserType;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export type ValidatedSession = {
  user: SessionUser;
  expires: string;
};

export type ValidationResult = {
  session: ValidatedSession;
  userAIConfig: UserAIConfig | null;
};

// Per-minute rate limiters cached by max requests value
const rateLimiters = new Map<number, RateLimiter>();

function getPerMinuteRateLimiter(maxRequests: number): RateLimiter {
  let limiter = rateLimiters.get(maxRequests);
  if (!limiter) {
    limiter = createPerMinuteRateLimiter(maxRequests);
    rateLimiters.set(maxRequests, limiter);
  }
  return limiter;
}

/**
 * Validates session, checks for BYOK config, and checks rate limits
 * @throws ChatSDKError if unauthorized or rate limited
 */
export async function validateSessionAndRateLimit(
  selectedChatModel: string
): Promise<ValidationResult> {
  const session = await auth();

  if (!session?.user) {
    throw new ChatSDKError("unauthorized:chat");
  }

  // Check if user has their own AI API key configured
  const userAIConfig = await getActiveUserAIConfig({ userId: session.user.id });

  // BYOK limits apply only when the user's own key actually serves the chosen
  // model; the app's key is never used on behalf of a BYOK user.
  const hasByok = !!userAIConfig;
  if (userAIConfig) {
    if (!isModelServedByUserConfig(selectedChatModel, userAIConfig)) {
      throw new ChatSDKError(
        "bad_request:api",
        "The selected model is not available with your API key. Pick a model from your provider."
      );
    }
  } else if (!isAllowedSystemModel(selectedChatModel)) {
    throw new ChatSDKError("bad_request:api", "Unknown model.");
  }

  const userType: UserType = session.user.type;
  const entitlements = getEntitlements(userType, hasByok);

  // Check daily rate limit
  const messageCount = await getMessageCountByUserId({
    id: session.user.id,
    differenceInHours: 24,
  });

  if (messageCount >= entitlements.maxMessagesPerDay) {
    throw new ChatSDKError("rate_limit:chat");
  }

  // Check per-minute rate limit using sliding window
  const rateLimiter = getPerMinuteRateLimiter(
    entitlements.maxMessagesPerMinute
  );
  const rateLimitResult = await rateLimiter.check(session.user.id);

  if (!rateLimitResult.allowed) {
    throw new ChatSDKError(
      "rate_limit:chat",
      `Too many requests. Please wait ${Math.ceil(rateLimitResult.resetIn / 1000)} seconds before sending another message.`
    );
  }

  // Per-IP limits (skipped for BYOK, which spends the user's own money, and
  // when the IP is unknown rather than throttling everyone together).
  const ip = await getClientIp();
  if (!hasByok && ip !== "unknown") {
    const perMinute = await getIpLimiter(
      60_000,
      entitlements.maxMessagesPerMinute * IP_QUOTA_MULTIPLIER
    ).check(`chat-min:${ip}`);
    const perDay = await getIpLimiter(
      DAY_MS,
      entitlements.maxMessagesPerDay * IP_QUOTA_MULTIPLIER
    ).check(`chat-day:${ip}`);
    if (!(perMinute.allowed && perDay.allowed)) {
      throw new ChatSDKError("rate_limit:chat");
    }
  }

  return {
    session: session as ValidatedSession,
    userAIConfig,
  };
}
