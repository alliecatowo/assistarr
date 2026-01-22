import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { trackDbQuery } from "@/lib/metrics";

const log = createLogger("database");

/** Threshold in milliseconds for logging slow queries */
const SLOW_QUERY_THRESHOLD_MS = 100;

/**
 * Create a postgres client with query logging for observability
 *
 * Features:
 * - Logs slow queries (>100ms) at warn level
 * - Tracks query metrics via OpenTelemetry
 * - Debug-level logging for all queries in development
 */
const client = postgres(env.POSTGRES_URL, {
  // Connection settings
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds

  // Query logging and debugging
  debug: (_connection, query, params, _types) => {
    // Only enable detailed debug logging in development
    if (process.env.NODE_ENV === "development") {
      log.debug(
        {
          query: query.slice(0, 500), // Truncate long queries
          paramCount: params?.length ?? 0,
        },
        "Executing query"
      );
    }
  },

  // Called when a query completes
  onnotice: (notice) => {
    log.debug({ notice }, "Database notice");
  },
});

/**
 * Wrapper to track query execution time
 *
 * This function wraps database operations to measure execution time
 * and log slow queries for debugging and optimization.
 *
 * @param operation - Type of operation (e.g., 'select', 'insert')
 * @param table - Table being queried
 * @param fn - The async operation to execute
 * @returns The result of the operation
 *
 * @example
 * ```ts
 * const users = await trackQuery('select', 'users', async () => {
 *   return db.select().from(usersTable).where(eq(usersTable.id, id));
 * });
 * ```
 */
export async function trackQuery<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  let success = true;

  try {
    const result = await fn();
    return result;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const durationMs = performance.now() - start;

    // Log slow queries at warn level
    if (durationMs >= SLOW_QUERY_THRESHOLD_MS) {
      log.warn(
        { operation, table, durationMs: Math.round(durationMs), success },
        "Slow database query detected"
      );
    }

    // Track metrics for all queries
    trackDbQuery(operation, table, durationMs, success);
  }
}

export const db = drizzle(client);
