import pino, { type Logger, type LoggerOptions } from "pino";

/**
 * Server-side logger using Pino
 *
 * This module provides a configured Pino logger for server-side code.
 * DO NOT use this in client components or Edge runtime.
 *
 * Usage:
 * ```ts
 * import { logger, createLogger } from '@/lib/logger';
 *
 * // Use the default logger
 * logger.info('Hello world');
 * logger.error({ err }, 'Something went wrong');
 *
 * // Create a child logger with context
 * const log = createLogger('my-module');
 * log.info({ userId: '123' }, 'User action');
 * ```
 */

const isDevelopment = process.env.NODE_ENV === "development";
const isTest = Boolean(
  process.env.VITEST ||
    process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
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
 * Type export for use in other modules
 */
export type { Logger } from "pino";
