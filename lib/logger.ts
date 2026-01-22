import { captureException, captureMessage, withScope } from "@sentry/nextjs";
import pino, { type Logger, type LoggerOptions } from "pino";

/**
 * Server-side logger using Pino with Sentry integration
 *
 * This module provides a configured Pino logger for server-side code.
 * DO NOT use this in client components or Edge runtime.
 *
 * Features:
 * - Structured JSON logging in production
 * - Pretty printing in development
 * - Automatic error-level log forwarding to Sentry
 * - Request correlation ID support
 *
 * Usage:
 * ```ts
 * import { logger, createLogger, withCorrelationId } from '@/lib/logger';
 *
 * // Use the default logger
 * logger.info('Hello world');
 * logger.error({ err }, 'Something went wrong');
 *
 * // Create a child logger with context
 * const log = createLogger('my-module');
 * log.info({ userId: '123' }, 'User action');
 *
 * // Create a logger with correlation ID for request tracing
 * const requestLog = withCorrelationId('req-123');
 * requestLog.info('Processing request');
 * ```
 */

const isDevelopment = process.env.NODE_ENV === "development";
const isTest = Boolean(
  process.env.VITEST ||
    process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);
const sentryEnabled = Boolean(
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
);

/**
 * Base log level based on environment
 * - development: debug
 * - test: silent (suppress logs during tests)
 * - production: info
 */
function getLogLevel(): string {
  if (isTest) {
    return "silent";
  }
  if (isDevelopment) {
    return "debug";
  }
  return "info";
}

/**
 * Helper function to capture log entries to Sentry
 * Extracted to reduce cognitive complexity
 */
function captureToSentry(
  level: number,
  logObj: Record<string, unknown>,
  error: Error | undefined,
  message: string
): void {
  withScope((scope) => {
    // Add log context as extra data
    scope.setExtra("logLevel", level === 60 ? "fatal" : "error");
    scope.setExtra("logContext", logObj);

    // Add correlation ID if present
    const correlationId = logObj.correlationId;
    if (correlationId) {
      scope.setTag("correlationId", String(correlationId));
    }

    // Add module name if present
    const moduleName = logObj.module;
    if (moduleName) {
      scope.setTag("module", String(moduleName));
    }

    if (error instanceof Error) {
      scope.setExtra("errorMessage", message);
      captureException(error);
    } else {
      captureMessage(message, level === 60 ? "fatal" : "error");
    }
  });
}

/**
 * Custom Sentry hook that captures error-level logs
 *
 * This hook intercepts log entries at error and fatal levels
 * and sends them to Sentry for centralized error tracking.
 */
function createSentryHook(): pino.LoggerOptions["hooks"] {
  if (!sentryEnabled) {
    return undefined;
  }

  return {
    logMethod(
      inputArgs: Parameters<pino.LogFn>,
      method: pino.LogFn,
      level: number
    ) {
      // Level 50 = error, 60 = fatal in pino
      if (level >= 50) {
        const [obj, msg] = inputArgs;

        // Extract error from the log object if present
        const logObj: Record<string, unknown> =
          typeof obj === "object" && obj !== null
            ? (obj as Record<string, unknown>)
            : {};
        const error = logObj.err as Error | undefined;
        const message = typeof msg === "string" ? msg : String(obj);

        // Capture to Sentry with additional context
        captureToSentry(level, logObj, error, message);
      }

      // Always call the original method
      return method.apply(this, inputArgs);
    },
  };
}

/**
 * Pino configuration options
 */
const loggerOptions: LoggerOptions = {
  level: getLogLevel(),
  // In development, use pino-pretty for human-readable output
  // In production, use JSON for log aggregation systems
  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
  // Base context included in all logs
  base: {
    env: process.env.NODE_ENV,
  },
  // Customize timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,
  // Format error objects properly
  formatters: {
    level: (label) => ({ level: label }),
  },
  // Add Sentry hook for error-level logs
  hooks: createSentryHook(),
};

/**
 * Main logger instance
 * Use this for general logging throughout the application
 */
export const logger: Logger = pino(loggerOptions);

/**
 * Create a child logger with a specific module/context name
 * This is useful for adding context to logs from specific parts of the app
 *
 * @param name - Module or context name (e.g., 'rate-limit', 'radarr-client')
 * @param bindings - Additional context to include in all logs from this logger
 * @returns A child logger with the given context
 *
 * @example
 * ```ts
 * const log = createLogger('radarr');
 * log.info({ movieId: 123 }, 'Movie added');
 * // Output: {"level":"info","module":"radarr","movieId":123,"msg":"Movie added"}
 * ```
 */
export function createLogger(
  name: string,
  bindings?: Record<string, unknown>
): Logger {
  return logger.child({ module: name, ...bindings });
}

/**
 * Create a child logger with a correlation ID for request tracing
 *
 * This allows tracking all logs related to a single request across
 * different modules and services. The correlation ID is also sent
 * to Sentry for error tracking.
 *
 * @param correlationId - Unique identifier for the request (e.g., UUID)
 * @param module - Optional module name for additional context
 * @returns A child logger with the correlation ID
 *
 * @example
 * ```ts
 * const requestId = crypto.randomUUID();
 * const log = withCorrelationId(requestId, 'api-handler');
 * log.info({ userId: '123' }, 'Processing request');
 * // Output: {"correlationId":"abc-123","module":"api-handler","userId":"123","msg":"Processing request"}
 * ```
 */
export function withCorrelationId(
  correlationId: string,
  module?: string
): Logger {
  const bindings: Record<string, unknown> = { correlationId };
  if (module) {
    bindings.module = module;
  }
  return logger.child(bindings);
}

/**
 * Type export for use in other modules
 */
export type { Logger } from "pino";
