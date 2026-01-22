import { auth, type UserType } from "@/app/(auth)/auth";
import { getEntitlements } from "@/lib/ai/entitlements";
import {
  getActiveUserAIConfig,
  getMessageCountByUserId,
} from "@/lib/db/queries/index";
import type { UserAIConfig } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import { createPerMinuteRateLimiter, type RateLimiter } from "@/lib/rate-limit";

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
export async function validateSessionAndRateLimit(): Promise<ValidationResult> {
  const session = await auth();

  if (!session?.user) {
    throw new ChatSDKError("unauthorized:chat");
  }

  // Check if user has their own AI API key configured
  const userAIConfig = await getActiveUserAIConfig({ userId: session.user.id });
  const hasByok = !!userAIConfig;

  const userType: UserType = session.user.type;
  const entitlements = getEntitlements(userType, hasByok);

  // Check daily rate limit
  const messageCount = await getMessageCountByUserId({
    id: session.user.id,
    differenceInHours: 24,
  });

  if (messageCount > entitlements.maxMessagesPerDay) {
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

  return {
    session: session as ValidatedSession,
    userAIConfig,
  };
}
