import { NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";

const log = createLogger("ready");

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
 * 503: {"status":"not-ready","timestamp":"..."}
 *
 * Public by design; the names of missing variables are logged, not returned.
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

  const hasAi =
    process.env.DEMO_MODE === "true" ||
    aiProviders.some((k) => Boolean(process.env[k]));
  if (!hasAi) {
    missing.push(`one of: ${aiProviders.join(", ")}`);
  }

  if (missing.length > 0) {
    log.error({ missing }, "Readiness check failed");
    return NextResponse.json(
      {
        status: "not-ready",
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
