import { NextResponse } from "next/server";

const VERSION = process.env.npm_package_version || "unknown";

/**
 * Lightweight readiness probe — no DB round-trip.
 * Checks only that required environment variables are present.
 *
 * Suitable for fast k8s/Docker readiness probes that run every few seconds.
 * Use /api/health for the full liveness + DB check.
 *
 * GET /api/ready
 *
 * 200: {"status":"ok","version":"3.1.0","timestamp":"..."}
 * 503: {"status":"not-ready","missing":["POSTGRES_URL"],"timestamp":"..."}
 */
export function GET() {
  const required = ["POSTGRES_URL", "AUTH_SECRET"] as const;
  const aiProviders = ["OPENROUTER_API_KEY", "AI_GATEWAY_API_KEY"] as const;

  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  const hasAi = aiProviders.some((k) => Boolean(process.env[k]));
  if (!hasAi) {
    missing.push(`one of: ${aiProviders.join(", ")}`);
  }

  if (missing.length > 0) {
    return NextResponse.json(
      {
        status: "not-ready",
        missing,
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      }
    );
  }

  return NextResponse.json(
    {
      status: "ok",
      version: VERSION,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    }
  );
}
