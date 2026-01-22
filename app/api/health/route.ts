import { NextResponse } from "next/server";
import postgres from "postgres";

// Read version from package.json at build time
const VERSION = process.env.npm_package_version || "unknown";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: CheckResult;
    redis?: CheckResult;
  };
}

interface CheckResult {
  status: "pass" | "fail";
  latency?: number;
  message?: string;
}

/**
 * Health check endpoint for container orchestration and monitoring
 * Returns 200 if healthy, 503 if unhealthy
 *
 * GET /api/health
 */
export async function GET() {
  const checks: HealthStatus["checks"] = {
    database: { status: "fail" },
  };

  // Check database connectivity
  const dbCheck = await checkDatabase();
  checks.database = dbCheck;

  // Check Redis if configured
  if (process.env.REDIS_URL) {
    checks.redis = await checkRedis();
  }

  // Determine overall status
  const allPassed = Object.values(checks).every((c) => c.status === "pass");
  const anyFailed = Object.values(checks).some((c) => c.status === "fail");

  let overallStatus: HealthStatus["status"];
  if (allPassed) {
    overallStatus = "healthy";
  } else if (anyFailed) {
    overallStatus = "unhealthy";
  } else {
    overallStatus = "degraded";
  }

  const response: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: VERSION,
    uptime: process.uptime(),
    checks,
  };

  return NextResponse.json(response, {
    status: overallStatus === "healthy" ? 200 : 503,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
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
