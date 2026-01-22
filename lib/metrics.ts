import { type Counter, type Histogram, metrics } from "@opentelemetry/api";
import { createLogger } from "./logger";

/**
 * Custom metrics helper for tracking key business metrics
 *
 * This module provides helper functions for tracking important metrics
 * using OpenTelemetry's metrics API. These metrics can be exported to
 * various observability backends (Prometheus, Grafana, etc.).
 *
 * Usage:
 * ```ts
 * import { trackToolExecution, trackChatLatency, trackApiCall } from '@/lib/metrics';
 *
 * // Track a tool execution
 * const start = performance.now();
 * await executeTool();
 * trackToolExecution('radarr_search', performance.now() - start, true);
 *
 * // Track chat latency
 * trackChatLatency(responseTime);
 *
 * // Track an external API call
 * trackApiCall('radarr', '/api/v3/movie', duration, 200);
 * ```
 */

const log = createLogger("metrics");

// Get the meter for this service
const meter = metrics.getMeter("assistarr", "1.0.0");

// ============================================================================
// Tool Execution Metrics
// ============================================================================

/**
 * Counter for total tool executions
 */
let toolExecutionCounter: Counter | null = null;

/**
 * Histogram for tool execution duration
 */
let toolDurationHistogram: Histogram | null = null;

function getToolExecutionCounter(): Counter {
  if (!toolExecutionCounter) {
    toolExecutionCounter = meter.createCounter("assistarr.tool.executions", {
      description: "Total number of AI tool executions",
      unit: "{executions}",
    });
  }
  return toolExecutionCounter;
}

function getToolDurationHistogram(): Histogram {
  if (!toolDurationHistogram) {
    toolDurationHistogram = meter.createHistogram("assistarr.tool.duration", {
      description: "Duration of AI tool executions in milliseconds",
      unit: "ms",
    });
  }
  return toolDurationHistogram;
}

/**
 * Track an AI tool execution
 *
 * @param toolName - Name of the tool that was executed (e.g., 'radarr_search_movies')
 * @param durationMs - Duration of the execution in milliseconds
 * @param success - Whether the execution was successful
 *
 * @example
 * ```ts
 * const start = performance.now();
 * try {
 *   const result = await executeTool(toolName, args);
 *   trackToolExecution(toolName, performance.now() - start, true);
 * } catch (error) {
 *   trackToolExecution(toolName, performance.now() - start, false);
 *   throw error;
 * }
 * ```
 */
export function trackToolExecution(
  toolName: string,
  durationMs: number,
  success: boolean
): void {
  try {
    const attributes = {
      "tool.name": toolName,
      "tool.success": success,
    };

    getToolExecutionCounter().add(1, attributes);
    getToolDurationHistogram().record(durationMs, attributes);

    log.debug(
      { toolName, durationMs, success },
      "Tool execution metric recorded"
    );
  } catch (error) {
    // Don't let metrics errors affect the main flow
    log.warn(
      { err: error, toolName },
      "Failed to record tool execution metric"
    );
  }
}

// ============================================================================
// Chat Latency Metrics
// ============================================================================

/**
 * Histogram for chat response latency
 */
let chatLatencyHistogram: Histogram | null = null;

/**
 * Counter for total chat requests
 */
let chatRequestCounter: Counter | null = null;

function getChatLatencyHistogram(): Histogram {
  if (!chatLatencyHistogram) {
    chatLatencyHistogram = meter.createHistogram("assistarr.chat.latency", {
      description: "Chat response latency in milliseconds",
      unit: "ms",
    });
  }
  return chatLatencyHistogram;
}

function getChatRequestCounter(): Counter {
  if (!chatRequestCounter) {
    chatRequestCounter = meter.createCounter("assistarr.chat.requests", {
      description: "Total number of chat requests",
      unit: "{requests}",
    });
  }
  return chatRequestCounter;
}

/**
 * Track chat response latency
 *
 * @param latencyMs - Time to first response in milliseconds
 * @param model - Optional model name used for the request
 * @param success - Whether the request was successful (default: true)
 *
 * @example
 * ```ts
 * const start = performance.now();
 * const response = await generateChatResponse();
 * trackChatLatency(performance.now() - start, 'gpt-4');
 * ```
 */
export function trackChatLatency(
  latencyMs: number,
  model?: string,
  success = true
): void {
  try {
    const attributes: Record<string, string | boolean> = {
      "chat.success": success,
    };
    if (model) {
      attributes["chat.model"] = model;
    }

    getChatRequestCounter().add(1, attributes);
    getChatLatencyHistogram().record(latencyMs, attributes);

    log.debug({ latencyMs, model, success }, "Chat latency metric recorded");
  } catch (error) {
    // Don't let metrics errors affect the main flow
    log.warn({ err: error }, "Failed to record chat latency metric");
  }
}

// ============================================================================
// External API Call Metrics
// ============================================================================

/**
 * Counter for total API calls
 */
let apiCallCounter: Counter | null = null;

/**
 * Histogram for API call duration
 */
let apiDurationHistogram: Histogram | null = null;

function getApiCallCounter(): Counter {
  if (!apiCallCounter) {
    apiCallCounter = meter.createCounter("assistarr.api.calls", {
      description: "Total number of external API calls",
      unit: "{calls}",
    });
  }
  return apiCallCounter;
}

function getApiDurationHistogram(): Histogram {
  if (!apiDurationHistogram) {
    apiDurationHistogram = meter.createHistogram("assistarr.api.duration", {
      description: "Duration of external API calls in milliseconds",
      unit: "ms",
    });
  }
  return apiDurationHistogram;
}

/**
 * Track an external API call
 *
 * @param service - Name of the service being called (e.g., 'radarr', 'sonarr')
 * @param endpoint - API endpoint path (e.g., '/api/v3/movie')
 * @param durationMs - Duration of the call in milliseconds
 * @param status - HTTP status code of the response
 *
 * @example
 * ```ts
 * const start = performance.now();
 * const response = await fetch(`${baseUrl}/api/v3/movie`);
 * trackApiCall('radarr', '/api/v3/movie', performance.now() - start, response.status);
 * ```
 */
export function trackApiCall(
  service: string,
  endpoint: string,
  durationMs: number,
  status: number
): void {
  try {
    const success = status >= 200 && status < 400;
    const statusCategory = `${Math.floor(status / 100)}xx`;

    const attributes = {
      "api.service": service,
      "api.endpoint": endpoint,
      "api.status": status.toString(),
      "api.status_category": statusCategory,
      "api.success": success,
    };

    getApiCallCounter().add(1, attributes);
    getApiDurationHistogram().record(durationMs, attributes);

    log.debug(
      { service, endpoint, durationMs, status },
      "API call metric recorded"
    );
  } catch (error) {
    // Don't let metrics errors affect the main flow
    log.warn(
      { err: error, service, endpoint },
      "Failed to record API call metric"
    );
  }
}

// ============================================================================
// Database Query Metrics
// ============================================================================

/**
 * Counter for total database queries
 */
let dbQueryCounter: Counter | null = null;

/**
 * Histogram for database query duration
 */
let dbDurationHistogram: Histogram | null = null;

function getDbQueryCounter(): Counter {
  if (!dbQueryCounter) {
    dbQueryCounter = meter.createCounter("assistarr.db.queries", {
      description: "Total number of database queries",
      unit: "{queries}",
    });
  }
  return dbQueryCounter;
}

function getDbDurationHistogram(): Histogram {
  if (!dbDurationHistogram) {
    dbDurationHistogram = meter.createHistogram("assistarr.db.duration", {
      description: "Duration of database queries in milliseconds",
      unit: "ms",
    });
  }
  return dbDurationHistogram;
}

/**
 * Track a database query execution
 *
 * @param operation - Type of operation (e.g., 'select', 'insert', 'update', 'delete')
 * @param table - Table name being queried
 * @param durationMs - Duration of the query in milliseconds
 * @param success - Whether the query was successful
 *
 * @example
 * ```ts
 * const start = performance.now();
 * const result = await db.select().from(users).where(eq(users.id, id));
 * trackDbQuery('select', 'users', performance.now() - start, true);
 * ```
 */
export function trackDbQuery(
  operation: string,
  table: string,
  durationMs: number,
  success: boolean
): void {
  try {
    const attributes = {
      "db.operation": operation,
      "db.table": table,
      "db.success": success,
    };

    getDbQueryCounter().add(1, attributes);
    getDbDurationHistogram().record(durationMs, attributes);

    log.debug(
      { operation, table, durationMs, success },
      "Database query metric recorded"
    );
  } catch (error) {
    // Don't let metrics errors affect the main flow
    log.warn(
      { err: error, operation, table },
      "Failed to record database query metric"
    );
  }
}

// ============================================================================
// Error Metrics
// ============================================================================

/**
 * Counter for errors by type
 */
let errorCounter: Counter | null = null;

function getErrorCounter(): Counter {
  if (!errorCounter) {
    errorCounter = meter.createCounter("assistarr.errors", {
      description: "Total number of errors by type and source",
      unit: "{errors}",
    });
  }
  return errorCounter;
}

/**
 * Track an error occurrence
 *
 * @param errorType - Type/category of the error (e.g., 'ValidationError', 'ApiError')
 * @param source - Source module where the error occurred
 * @param code - Optional error code for more specific categorization
 *
 * @example
 * ```ts
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   trackError(error.name, 'chat-handler', error.code);
 *   throw error;
 * }
 * ```
 */
export function trackError(
  errorType: string,
  source: string,
  code?: string
): void {
  try {
    const attributes: Record<string, string> = {
      "error.type": errorType,
      "error.source": source,
    };
    if (code) {
      attributes["error.code"] = code;
    }

    getErrorCounter().add(1, attributes);

    log.debug({ errorType, source, code }, "Error metric recorded");
  } catch (error) {
    // Don't let metrics errors affect the main flow
    log.warn(
      { err: error, errorType, source },
      "Failed to record error metric"
    );
  }
}
