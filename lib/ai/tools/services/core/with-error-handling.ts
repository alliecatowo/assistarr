import { isServiceClientError, type ServiceClientError } from "./errors";

/**
 * Configuration for the error handling wrapper
 */
interface ErrorHandlingConfig {
  /** Service name for error messages (e.g., 'Radarr', 'Sonarr') */
  serviceName: string;
  /** Operation name for error messages (e.g., 'search movies', 'add series') */
  operationName: string;
}

/**
 * Standard error response format for tools
 */
interface ErrorResponse {
  error: string;
}

/**
 * Higher-order function that wraps tool execute functions with standardized error handling.
 * Reduces ~20 lines of duplicated error handling per tool to a single wrapper.
 *
 * @example
 * ```ts
 * execute: withToolErrorHandling(
 *   { serviceName: "Radarr", operationName: "search movies" },
 *   async ({ query }) => {
 *     const results = await radarrRequest<RadarrMovie[]>(
 *       session.user.id,
 *       `/movie/lookup?term=${encodeURIComponent(query)}`
 *     );
 *     return { results, message: `Found ${results.length} movies.` };
 *   }
 * )
 * ```
 */
export function withToolErrorHandling<TInput, TOutput>(
  config: ErrorHandlingConfig,
  executeFn: (input: TInput) => Promise<TOutput>
): (input: TInput) => Promise<TOutput | ErrorResponse> {
  const { serviceName, operationName } = config;

  return async (input: TInput): Promise<TOutput | ErrorResponse> => {
    try {
      return await executeFn(input);
    } catch (error) {
      return formatToolError(error, serviceName, operationName);
    }
  };
}

/**
 * Format an error into a standardized tool error response.
 * Exported for use in tools that need custom error handling logic.
 */
export function formatToolError(
  error: unknown,
  serviceName: string,
  operationName: string
): ErrorResponse {
  if (isServiceClientError(error)) {
    return formatServiceClientError(error, operationName);
  }

  // Generic error fallback
  const message =
    error instanceof Error ? error.message : "Unknown error occurred";
  return {
    error: `${serviceName}: Failed to ${operationName}: ${message}`,
  };
}

/**
 * Format a ServiceClientError into a user-friendly error response.
 */
function formatServiceClientError(
  error: ServiceClientError,
  operationName: string
): ErrorResponse {
  // Authentication errors
  if (error.isAuthError()) {
    return {
      error: `${error.service} authentication failed: ${error.message}. Please check your API key in settings.`,
    };
  }

  // Not found errors
  if (error.isNotFound()) {
    return {
      error: `${error.service} endpoint not found: ${error.message}. Please verify your ${error.service} URL in settings.`,
    };
  }

  // Bad request errors (validation issues)
  if (error.isBadRequest()) {
    return {
      error: `${error.service} validation error: ${error.message}`,
    };
  }

  // Configuration errors (no status code)
  if (!error.statusCode) {
    return {
      error: error.message,
    };
  }

  // Generic API errors with operation context
  return {
    error: `Failed to ${operationName}: ${error.message}`,
  };
}

/**
 * Type guard to check if a result is an error response
 */
export function isErrorResponse(result: unknown): result is ErrorResponse {
  return (
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof (result as ErrorResponse).error === "string"
  );
}
