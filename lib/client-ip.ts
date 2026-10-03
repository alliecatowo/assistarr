import { headers } from "next/headers";

/**
 * Best-effort client IP. On Vercel `x-forwarded-for` / `x-real-ip` are set by
 * the platform edge and cannot be spoofed by the client; behind another proxy
 * make sure it overwrites these headers.
 */
export function ipFromHeaders(h: Pick<Headers, "get">): string {
  const forwarded = h.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || h.get("x-real-ip")?.trim() || "unknown";
}

export async function getClientIp(): Promise<string> {
  try {
    return ipFromHeaders(await headers());
  } catch {
    return "unknown";
  }
}
