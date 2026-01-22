import "server-only";
import { isDevelopment, isProduction, isTest } from "./env";

export const isProductionEnvironment = isProduction;
export const isDevelopmentEnvironment = isDevelopment;
export const isTestEnvironment = isTest;

// Pre-computed bcrypt hash for timing attack prevention
// This is used when a user doesn't exist to make response time consistent
// (prevents attackers from determining if an email exists based on timing)
export const TIMING_SAFE_HASH =
  "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

// Re-export shared constants for server-side convenience
export { guestRegex } from "./shared-constants";
