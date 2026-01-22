/**
 * Retry utility with exponential backoff and jitter for external API calls.
 *
 * Only retries on transient errors:
 * - Network errors (fetch failures)
 * - 429 Too Many Requests
 * - 502 Bad Gateway
 * - 503 Service Unavailable
 * - 504 Gateway Timeout
 *
 * Does NOT retry on:
 * - Client errors (4xx except 429)
 * - Business logic errors
 */

import { createLogger } from "../logger";

const log = createLogger("retry");

/** Error class that includes HTTP status code information */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Options for configuring retry behavior */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds before first retry (default: 1000) */
  baseDelay?: number;
  /** Maximum delay cap in milliseconds (default: 30000) */
  maxDelay?: number;
  /**
   * Custom function to determine if an error should trigger a retry.
   * Return true to retry, false to fail immediately.
   * If not provided, uses default transient error detection.
   */
  shouldRetry?: (error: Error, attempt: number) => boolean;
  /** Callback invoked before each retry attempt (useful for logging) */
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

/** HTTP status codes that indicate transient errors worth retrying */
const RETRYABLE_STATUS_CODES = [429, 502, 503, 504] as const;

/**
 * Determines if an error is a transient error that should be retried.
 * - Network errors (TypeError from fetch)
 * - Specific HTTP status codes (429, 502, 503, 504)
 */
export function isTransientError(error: Error): boolean {
  // Network errors from fetch appear as TypeError
  if (error.name === "TypeError" && error.message.includes("fetch")) {
    return true;
  }

  // Check for network-related error messages
  if (
    error.message.includes("ECONNREFUSED") ||
    error.message.includes("ECONNRESET") ||
    error.message.includes("ETIMEDOUT") ||
    error.message.includes("ENOTFOUND") ||
    error.message.includes("network") ||
    error.message.includes("Network")
  ) {
    return true;
  }

  // HTTP errors with retryable status codes
  if (error instanceof HttpError) {
    return RETRYABLE_STATUS_CODES.includes(
      error.status as (typeof RETRYABLE_STATUS_CODES)[number]
    );
  }

  // Check error message for status codes (fallback for non-HttpError)
  for (const code of RETRYABLE_STATUS_CODES) {
    if (error.message.includes(String(code))) {
      return true;
    }
  }

  return false;
}

/**
 * Calculates delay with exponential backoff and jitter.
 * Formula: min(maxDelay, baseDelay * 2^attempt) + random jitter
 *
 * @param attempt - The current attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay cap in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * 2 ** attempt;

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter: random value between 0 and 25% of the delay
  const jitter = Math.random() * cappedDelay * 0.25;

  return Math.floor(cappedDelay + jitter);
}

/**
 * Wraps an async operation with retry logic using exponential backoff.
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the async function
 * @throws The last error if all retries are exhausted
 *
 * @example
 * // Basic usage with defaults
 * const result = await withRetry(() => fetchData());
 *
 * @example
 * // Custom configuration
 * const result = await withRetry(
 *   () => fetchData(),
 *   {
 *     maxRetries: 5,
 *     baseDelay: 500,
 *     onRetry: (error, attempt, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms: ${error.message}`);
 *     }
 *   }
 * );
 *
 * @example
 * // Disable retries for specific operation
 * const result = await withRetry(
 *   () => fetchData(),
 *   { maxRetries: 0 }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30_000,
    shouldRetry = isTransientError,
    onRetry,
  } = options;

  let lastError: Error = new Error("No error occurred");
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      const canRetry = attempt < maxRetries && shouldRetry(lastError, attempt);

      if (!canRetry) {
        log.debug(
          { error: lastError.message, attempt },
          "Retry exhausted, throwing error"
        );
        throw lastError;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = calculateBackoffDelay(attempt, baseDelay, maxDelay);

      log.warn(
        { error: lastError.message, attempt, delayMs: delay },
        "Retrying after error"
      );

      // Invoke retry callback if provided
      onRetry?.(lastError, attempt + 1, delay);

      // Wait before retrying
      await sleep(delay);

      attempt++;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/** Simple sleep utility */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a retry wrapper with pre-configured options.
 * Useful for creating service-specific retry configurations.
 *
 * @example
 * const retryWithLogging = createRetryWrapper({
 *   maxRetries: 5,
 *   onRetry: (error, attempt) => console.log(`Attempt ${attempt}: ${error.message}`)
 * });
 *
 * const result = await retryWithLogging(() => fetchData());
 */
export function createRetryWrapper(defaultOptions: RetryOptions) {
  return <T>(
    fn: () => Promise<T>,
    overrideOptions?: RetryOptions
  ): Promise<T> => {
    return withRetry(fn, { ...defaultOptions, ...overrideOptions });
  };
}
