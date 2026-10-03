import { NextResponse } from "next/server";
import { RateLimiter } from "@/lib/rate-limit";

// Discover routes make a paid LLM call per request; cap them per user.
const limiter = new RateLimiter({ windowMs: 60 * 60 * 1000, maxRequests: 30 });

/** Returns a 429 response when the user is over the hourly LLM-route budget. */
export async function limitLlmRoute(
  userId: string,
  route: string
): Promise<Response | null> {
  const result = await limiter.check(`llm:${route}:${userId}`);
  if (result.allowed) {
    return null;
  }
  return NextResponse.json(
    { error: "Too many requests. Try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(result.resetIn / 1000)) },
    }
  );
}
