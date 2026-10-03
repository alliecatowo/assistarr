import type { UserType } from "@/app/(auth)/auth";
import { isDemoMode } from "@/lib/demo/mode";

type Entitlements = {
  maxMessagesPerDay: number;
  maxMessagesPerMinute: number;
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 50,
    maxMessagesPerMinute: 10,
  },

  /*
   * For users with an account (using app's API keys)
   */
  regular: {
    maxMessagesPerDay: 50,
    maxMessagesPerMinute: 10,
  },
};

/**
 * Entitlements for users who bring their own API keys (BYOK).
 * Much higher limits since they're paying for their own usage.
 */
export const byokEntitlements: Entitlements = {
  maxMessagesPerDay: 10_000, // Effectively unlimited for personal use
  maxMessagesPerMinute: 60, // 1 request per second
};

/** Tight limits for the public demo (no BYOK there). */
const demoEntitlements: Entitlements = {
  maxMessagesPerDay: 40,
  maxMessagesPerMinute: 6,
};

/**
 * Get entitlements for a user, considering if they have their own API keys
 */
export function getEntitlements(
  userType: UserType,
  hasByok: boolean
): Entitlements {
  if (isDemoMode()) {
    return demoEntitlements;
  }
  if (hasByok) {
    return byokEntitlements;
  }
  return entitlementsByUserType[userType];
}
