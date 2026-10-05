import { getClientIp } from "@/lib/client-ip";
import { RateLimiter } from "@/lib/rate-limit";

// New guest accounts per IP. Each guest is a DB row and a fresh message quota.
const GUEST_CREATIONS_PER_HOUR = Number(
  process.env.GUEST_CREATIONS_PER_HOUR_PER_IP ?? 30
);

const limiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: GUEST_CREATIONS_PER_HOUR,
});

/** Non-consuming check, for failing fast before the real attempt. */
export async function guestCreationAllowed(): Promise<boolean> {
  const ip = await getClientIp();
  if (ip === "unknown") {
    return true;
  }
  return (await limiter.peek(`guest:${ip}`)).allowed;
}

/** Consumes one guest-creation token for the caller's IP. */
export async function allowGuestCreation(): Promise<boolean> {
  const ip = await getClientIp();
  // No usable IP (local dev, tests): do not throttle everyone as one client.
  if (ip === "unknown") {
    return true;
  }
  const result = await limiter.check(`guest:${ip}`);
  return result.allowed;
}
