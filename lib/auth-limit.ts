import { getClientIp } from "@/lib/client-ip";
import { RateLimiter } from "@/lib/rate-limit";

const WINDOW_MS = 15 * 60 * 1000;

const LOGIN_PER_IP = Number(process.env.LOGIN_ATTEMPTS_PER_IP ?? 30);
const LOGIN_PER_EMAIL = Number(process.env.LOGIN_ATTEMPTS_PER_EMAIL ?? 10);
const REGISTER_PER_IP = Number(process.env.REGISTRATIONS_PER_IP ?? 5);

const loginIpLimiter = new RateLimiter({
  windowMs: WINDOW_MS,
  maxRequests: LOGIN_PER_IP,
});
const loginEmailLimiter = new RateLimiter({
  windowMs: WINDOW_MS,
  maxRequests: LOGIN_PER_EMAIL,
});
const registerLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: REGISTER_PER_IP,
});

/**
 * Consume one login attempt for this IP and this (normalized) email.
 * The per-email bucket stops distributed guessing against one account; the
 * per-IP bucket stops one client sweeping many accounts.
 */
export async function loginAttemptAllowed(email: string): Promise<boolean> {
  const ip = await getClientIp();
  const [byIp, byEmail] = await Promise.all([
    ip === "unknown"
      ? Promise.resolve({ allowed: true })
      : loginIpLimiter.check(`login:ip:${ip}`),
    loginEmailLimiter.check(`login:email:${email}`),
  ]);
  return byIp.allowed && byEmail.allowed;
}

/** Consume one account-registration slot for this IP. */
export async function registrationAllowed(): Promise<boolean> {
  const ip = await getClientIp();
  if (ip === "unknown") {
    return true;
  }
  return (await registerLimiter.check(`register:ip:${ip}`)).allowed;
}
