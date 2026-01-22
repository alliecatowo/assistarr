import type { z } from "zod";
import type { ServiceConfig } from "@/lib/db/schema";
import { createLogger } from "@/lib/logger";
import { HttpError, type RetryOptions, withRetry } from "@/lib/utils/retry";

const log = createLogger("api-client");

/** Default timeout for regular API requests (30 seconds) */
export const DEFAULT_TIMEOUT_MS = 30_000;
/** Timeout for health check requests (10 seconds) */
export const HEALTH_CHECK_TIMEOUT_MS = 10_000;

/** Options for API requests with timeout and retry configuration */
export interface RequestOptions<T = unknown> {
  /** Request timeout in milliseconds. Defaults to DEFAULT_TIMEOUT_MS (30s) */
  timeout?: number;
  /**
   * Retry configuration. Set to false to disable retries entirely.
   * By default, retries on transient errors (network, 429, 502, 503, 504).
   */
  retry?: RetryOptions | false;
  /**
   * Optional Zod schema for validating the response data.
   * When provided, the response will be parsed and validated against this schema.
   * If validation fails, a ZodError will be thrown.
   *
   * This allows gradual adoption - endpoints can be migrated to use schemas
   * one at a time without requiring all endpoints to change at once.
   *
   * @example
   * const movies = await client.get("/movie", undefined, {
   *   schema: RadarrMovieArraySchema
   * });
   */
  schema?: z.ZodType<T>;
}

/** Default retry options for API calls */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30_000,
};

/**
 * Creates an AbortController with a timeout that automatically aborts the request.
 * Returns a cleanup function that should be called in a finally block.
 */
function createTimeoutController(timeoutMs: number): {
  controller: AbortController;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return {
    controller,
    cleanup: () => clearTimeout(timeoutId),
  };
}

/**
 * Base API client with centralized API prefix configuration, timeout, and retry support.
 *
 * Each service client extends this and sets its apiPrefix, e.g.:
 * - Radarr/Sonarr: "/api/v3"
 * - Jellyseerr: "/api/v1"
 * - Jellyfin: "" (no prefix)
 *
 * This allows endpoints to be defined as simple paths like "/movie"
 * and the client automatically prepends the correct API prefix.
 *
 * Timeout behavior:
 * - All requests have a configurable timeout (default 30s)
 * - Timed out requests throw an error with context
 *
 * Retry behavior:
 * - By default, all requests retry on transient errors (network, 429, 502, 503, 504)
 * - Retries use exponential backoff with jitter
 * - Retries can be configured or disabled per-request
 * - Client errors (4xx except 429) are NOT retried
 */
export class ApiClient {
  /**
   * API route prefix to prepend to all paths.
   * Override in subclass to set service-specific prefix.
   * Examples: "/api/v3" for Radarr/Sonarr, "/api/v1" for Jellyseerr
   */
  protected readonly apiPrefix: string = "";

  constructor(protected config: ServiceConfig) {}

  protected getHeaders(): Promise<HeadersInit> {
    // Basic API Key auth (customizable via subclass or config if needed)
    return Promise.resolve({
      "X-Api-Key": this.config.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    });
  }

  /**
   * Build the full URL for a request.
   * If path already starts with the apiPrefix, use it as-is.
   * Otherwise, prepend the apiPrefix.
   */
  private getUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    // Strip trailing slashes and common API suffixes to ensure clean path appending
    const baseUrl = this.config.baseUrl
      .replace(/\/$/, "")
      .replace(/\/api\/v[0-9]+$/, "")
      .replace(/\/api$/, "");

    // Determine if we need to add the API prefix
    // Don't double-add if path already includes it
    let fullPath = path;
    if (this.apiPrefix && !path.startsWith(this.apiPrefix)) {
      fullPath = `${this.apiPrefix}${path}`;
    }

    const url = new URL(`${baseUrl}${fullPath}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    return url.toString();
  }

  /**
   * Resolve retry options from request options.
   * Returns options with maxRetries: 0 if retries are disabled.
   */
  private getRetryOptions(requestOptions?: RequestOptions): RetryOptions {
    if (requestOptions?.retry === false) {
      return { maxRetries: 0 };
    }
    if (requestOptions?.retry) {
      return { ...DEFAULT_RETRY_OPTIONS, ...requestOptions.retry };
    }
    return DEFAULT_RETRY_OPTIONS;
  }

  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    options?: RequestOptions<T>
  ): Promise<T> {
    const url = this.getUrl(path, params);
    const headers = await this.getHeaders();
    const timeoutMs = options?.timeout ?? DEFAULT_TIMEOUT_MS;
    const retryOptions = this.getRetryOptions(options);
    const schema = options?.schema;

    const fetchFn = async () => {
      const { controller, cleanup } = createTimeoutController(timeoutMs);

      try {
        const response = await fetch(url, {
          headers,
          signal: controller.signal,
        });

        if (!response.ok) {
          log.warn(
            { url, status: response.status, statusText: response.statusText },
            `GET ${path} failed`
          );
          throw new HttpError(
            `GET ${path} failed: ${response.status} ${response.statusText}`,
            response.status,
            response.statusText
          );
        }

        return this.handleJson<T>(response, schema);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          log.error({ url, timeoutMs }, `GET ${path} timed out`);
          throw new Error(`GET ${path} timed out after ${timeoutMs}ms`);
        }
        throw error;
      } finally {
        cleanup();
      }
    };

    return withRetry(fetchFn, retryOptions);
  }

  async post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions<T>
  ): Promise<T> {
    const headers = await this.getHeaders();
    const timeoutMs = options?.timeout ?? DEFAULT_TIMEOUT_MS;
    const retryOptions = this.getRetryOptions(options);
    const url = this.getUrl(path);
    const schema = options?.schema;

    const fetchFn = async () => {
      const { controller, cleanup } = createTimeoutController(timeoutMs);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          log.warn(
            { url, status: response.status, statusText: response.statusText },
            `POST ${path} failed`
          );
          throw new HttpError(
            `POST ${path} failed: ${response.status} ${response.statusText}`,
            response.status,
            response.statusText
          );
        }

        return this.handleJson<T>(response, schema);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          log.error({ url, timeoutMs }, `POST ${path} timed out`);
          throw new Error(`POST ${path} timed out after ${timeoutMs}ms`);
        }
        throw error;
      } finally {
        cleanup();
      }
    };

    return withRetry(fetchFn, retryOptions);
  }

  async put<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions<T>
  ): Promise<T> {
    const headers = await this.getHeaders();
    const timeoutMs = options?.timeout ?? DEFAULT_TIMEOUT_MS;
    const retryOptions = this.getRetryOptions(options);
    const url = this.getUrl(path);
    const schema = options?.schema;

    const fetchFn = async () => {
      const { controller, cleanup } = createTimeoutController(timeoutMs);

      try {
        const response = await fetch(url, {
          method: "PUT",
          headers,
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          log.warn(
            { url, status: response.status, statusText: response.statusText },
            `PUT ${path} failed`
          );
          throw new HttpError(
            `PUT ${path} failed: ${response.status} ${response.statusText}`,
            response.status,
            response.statusText
          );
        }

        return this.handleJson<T>(response, schema);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          log.error({ url, timeoutMs }, `PUT ${path} timed out`);
          throw new Error(`PUT ${path} timed out after ${timeoutMs}ms`);
        }
        throw error;
      } finally {
        cleanup();
      }
    };

    return withRetry(fetchFn, retryOptions);
  }

  async delete<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    body?: unknown,
    options?: RequestOptions<T>
  ): Promise<T> {
    const headers = await this.getHeaders();
    const timeoutMs = options?.timeout ?? DEFAULT_TIMEOUT_MS;
    const retryOptions = this.getRetryOptions(options);
    const url = this.getUrl(path, params);
    const schema = options?.schema;

    const fetchFn = async () => {
      const { controller, cleanup } = createTimeoutController(timeoutMs);

      try {
        const response = await fetch(url, {
          method: "DELETE",
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        if (!response.ok) {
          log.warn(
            { url, status: response.status, statusText: response.statusText },
            `DELETE ${path} failed`
          );
          throw new HttpError(
            `DELETE ${path} failed: ${response.status} ${response.statusText}`,
            response.status,
            response.statusText
          );
        }

        return this.handleJson<T>(response, schema);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          log.error({ url, timeoutMs }, `DELETE ${path} timed out`);
          throw new Error(`DELETE ${path} timed out after ${timeoutMs}ms`);
        }
        throw error;
      } finally {
        cleanup();
      }
    };

    return withRetry(fetchFn, retryOptions);
  }

  /**
   * Parse JSON response and optionally validate against a Zod schema.
   *
   * When a schema is provided, the parsed JSON is validated against it.
   * This provides runtime type safety for external API responses,
   * preventing untrusted data from being blindly trusted as typed objects.
   *
   * @param response - The fetch Response object
   * @param schema - Optional Zod schema for validation
   * @returns Parsed (and optionally validated) response data
   * @throws Error if JSON parsing fails
   * @throws ZodError if schema validation fails
   */
  private async handleJson<T>(
    response: Response,
    schema?: z.ZodType<T>
  ): Promise<T> {
    const text = await response.text();
    if (!text) {
      // For empty responses, return empty object
      // If schema is provided, it will validate this (likely failing for non-object schemas)
      const emptyData = {} as T;
      if (schema) {
        return schema.parse(emptyData);
      }
      return emptyData;
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch (_) {
      // If parsing fails, throw a more helpful error with context
      const preview = text.slice(0, 200);
      log.error(
        { preview, url: response.url },
        "Failed to parse JSON response"
      );
      throw new Error(
        `Failed to parse JSON response: ${preview}${
          text.length > 200 ? "..." : ""
        }`
      );
    }

    // If schema is provided, validate the parsed data
    if (schema) {
      try {
        return schema.parse(data);
      } catch (error) {
        // Log validation error with context for debugging
        log.error(
          { url: response.url, error },
          "API response validation failed"
        );
        throw error;
      }
    }

    // Fallback for gradual migration - return unvalidated data
    return data as T;
  }
}
