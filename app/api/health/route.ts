import { NextResponse } from "next/server";
import postgres from "postgres";

// Read version from package.json at build time
const VERSION = process.env.npm_package_version || "unknown";

// Required environment variables for a healthy deployment
const REQUIRED_ENV_VARS = ["POSTGRES_URL", "AUTH_SECRET"] as const;

// At least one AI provider key must be set
const AI_PROVIDER_ENV_VARS = [
  "OPENROUTER_API_KEY",
  "AI_GATEWAY_API_KEY",
] as const;

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    env: CheckResult;
    database: CheckResult;
    redis?: CheckResult;
  };
}

interface CheckResult {
  status: "pass" | "fail" | "warn";
  latency?: number;
  message?: string;
  details?: Record<string, string>;
}

/**
 * Health check endpoint for container orchestration and monitoring.
 * Returns 200 if healthy/degraded, 503 if unhealthy.
 *
 * GET /api/health
 *
 * Response shape:
 * {
 *   "status": "healthy" | "degraded" | "unhealthy",
 *   "version": "3.1.0",
 *   "timestamp": "2026-03-09T00:00:00.000Z",
 *   "uptime": 1234.5,
 *   "checks": { "env": {...}, "database": {...}, "redis": {...} }
 * }
 */
export async function GET() {
  const checks: HealthStatus["checks"] = {
    env: checkEnv(),
    database: { status: "fail" },
  };

  // Only check database if env vars are present
  if (checks.env.status !== "fail") {
    checks.database = await checkDatabase();
  } else {
    checks.database = {
      status: "fail",
      message: "Skipped — missing required env vars",
    };
  }

  // Check Redis if configured
  if (process.env.REDIS_URL) {
    checks.redis = await checkRedis();
  }

  // Determine overall status:
  // - "unhealthy" if env or database fails (app cannot serve requests)
  // - "degraded" if optional services (redis) fail
  // - "healthy" if all checks pass
  const criticalFailed =
    checks.env.status === "fail" || checks.database.status === "fail";
  const anyOptionalFailed = checks.redis?.status === "fail";

  let overallStatus: HealthStatus["status"];
  if (criticalFailed) {
    overallStatus = "unhealthy";
  } else if (anyOptionalFailed) {
    overallStatus = "degraded";
  } else {
    overallStatus = "healthy";
  }

  const response: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: VERSION,
    uptime: process.uptime(),
    checks,
  };

  // 200 for healthy/degraded (app is serving), 503 for unhealthy
  const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

/**
 * Check that all required environment variables are set.
 * Does NOT validate values — just presence.
 */
function checkEnv(): CheckResult {
  const missing: string[] = [];
  const present: Record<string, string> = {};

  // Check required vars
  for (const key of REQUIRED_ENV_VARS) {
    if (process.env[key]) {
      present[key] = "set";
    } else {
      missing.push(key);
    }
  }

  // Check AI provider (at least one required)
  const hasAiProvider = AI_PROVIDER_ENV_VARS.some((key) =>
    Boolean(process.env[key])
  );
  if (hasAiProvider) {
    for (const key of AI_PROVIDER_ENV_VARS) {
      if (process.env[key]) {
        present[key] = "set";
      }
    }
  } else {
    missing.push(`one of: ${AI_PROVIDER_ENV_VARS.join(", ")}`);
  }

  if (missing.length > 0) {
    return {
      status: "fail",
      message: `Missing required environment variables: ${missing.join(", ")}`,
    };
  }

  return {
    status: "pass",
    details: present,
  };
}

async function checkDatabase(): Promise<CheckResult> {
  const dbUrl = process.env.POSTGRES_URL;
  if (!dbUrl) {
    return {
      status: "fail",
      message: "POSTGRES_URL not configured",
    };
  }

  const start = Date.now();
  try {
    const sql = postgres(dbUrl, { max: 1, idle_timeout: 5 });
    await sql`SELECT 1`;
    await sql.end();
    return {
      status: "pass",
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "fail",
      latency: Date.now() - start,
      message:
        error instanceof Error ? error.message : "Database connection failed",
    };
  }
}

async function checkRedis(): Promise<CheckResult> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return {
      status: "fail",
      message: "REDIS_URL not configured",
    };
  }

  const start = Date.now();
  try {
    // Dynamic import to avoid loading redis when not needed
    const { createClient } = await import("redis");
    const client = createClient({ url: redisUrl });
    await client.connect();
    await client.ping();
    await client.disconnect();
    return {
      status: "pass",
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      status: "fail",
      latency: Date.now() - start,
      message:
        error instanceof Error ? error.message : "Redis connection failed",
    };
  }
}
