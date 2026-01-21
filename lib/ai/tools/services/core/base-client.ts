import { getServiceConfig } from "@/lib/db/queries/index";
import type { ServiceConfig } from "@/lib/db/schema";
import type { AuthStrategy } from "./auth-strategies";
import { ServiceClientError } from "./errors";

/**
 * Configuration for creating a service client
 */
export interface ServiceClientConfig {
  /** Internal service name (e.g., 'radarr', 'sonarr') */
  serviceName: string;
  /** Human-readable display name (e.g., 'Radarr', 'Sonarr') */
  displayName: string;
  /** API version prefix (e.g., '/api/v3', '/api/v1') */
  apiVersion: string;
  /** Authentication strategy to use */
  authStrategy: AuthStrategy;
  /** Whether to validate that API key is present (default: true) */
  requireApiKey?: boolean;
}

/**
 * Interface for the generated service client
 */
export interface ServiceClient {
  /** Get service configuration for a user */
  getConfig: (userId: string) => Promise<ServiceConfig | null>;
  /** Make an authenticated request to the service */
  request: <T>(
    userId: string,
    endpoint: string,
    options?: RequestInit
  ) => Promise<T>;
  /** Service display name for error messages */
  displayName: string;
  /** Service internal name */
  serviceName: string;
}

/**
 * Parse validation error array format: [{ propertyName, errorMessage }]
 */
function parseValidationErrors(
  errorData: Array<{ propertyName?: string; errorMessage?: string }>
): string | null {
  const validationErrors = errorData
    .filter((e) => e.errorMessage)
    .map((e) =>
      e.propertyName ? `${e.propertyName}: ${e.errorMessage}` : e.errorMessage
    );
  return validationErrors.length > 0 ? validationErrors.join("; ") : null;
}

/**
 * Parse nested errors format: { errors: { field: ["message"] } }
 */
function parseNestedErrors(errors: Record<string, string[]>): string | null {
  const messages = Object.entries(errors).flatMap(([field, msgs]) =>
    msgs.map((msg) => `${field}: ${msg}`)
  );
  return messages.length > 0 ? messages.join("; ") : null;
}

/**
 * Extract message from error object with various field names
 */
function extractErrorMessage(
  errorData: Record<string, unknown>
): string | null {
  // Common field names for error messages
  const messageFields = [
    "message",
    "Message",
    "errorMessage",
    "error",
  ] as const;
  for (const field of messageFields) {
    if (typeof errorData[field] === "string") {
      return errorData[field];
    }
  }
  // Handle nested errors object
  if (errorData.errors && typeof errorData.errors === "object") {
    return parseNestedErrors(errorData.errors as Record<string, string[]>);
  }
  return null;
}

/**
 * Parse error response body into a readable message.
 * Handles various error formats from different APIs.
 */
async function parseErrorResponse(
  response: Response,
  serviceName: string
): Promise<string> {
  const defaultMessage = `${serviceName} API error: ${response.status} ${response.statusText}`;

  try {
    const errorData = await response.json();

    if (Array.isArray(errorData) && errorData.length > 0) {
      return parseValidationErrors(errorData) ?? defaultMessage;
    }

    if (typeof errorData === "object" && errorData !== null) {
      return extractErrorMessage(errorData) ?? defaultMessage;
    }
  } catch {
    // Ignore JSON parse errors
  }

  return defaultMessage;
}

/**
 * Create a service client with standardized error handling and authentication.
 * Dramatically reduces boilerplate in service client implementations.
 *
 * @example
 * ```ts
 * const client = createServiceClient({
 *   serviceName: "radarr",
 *   displayName: "Radarr",
 *   apiVersion: "/api/v3",
 *   authStrategy: ApiKeyHeaderAuth("X-Api-Key"),
 * });
 *
 * export const getRadarrConfig = client.getConfig;
 * export const radarrRequest = client.request;
 * ```
 */
export function createServiceClient(
  config: ServiceClientConfig
): ServiceClient {
  const {
    serviceName,
    displayName,
    apiVersion,
    authStrategy,
    requireApiKey = true,
  } = config;

  /**
   * Get service configuration for a user
   */
  function getConfig(userId: string): Promise<ServiceConfig | null> {
    return getServiceConfig({ userId, serviceName });
  }

  /**
   * Make an authenticated request to the service API
   */
  async function request<T>(
    userId: string,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const serviceConfig = await getConfig(userId);

    if (!serviceConfig) {
      throw ServiceClientError.notConfigured(displayName);
    }

    if (!serviceConfig.isEnabled) {
      throw ServiceClientError.disabled(displayName);
    }

    if (
      requireApiKey &&
      (!serviceConfig.apiKey || serviceConfig.apiKey.trim() === "")
    ) {
      throw ServiceClientError.missingApiKey(displayName);
    }

    const baseUrl = serviceConfig.baseUrl.replace(/\/+$/, "");
    const url = `${baseUrl}${apiVersion}${endpoint}`;

    const headers = authStrategy.applyAuth(
      {
        "Content-Type": "application/json",
        ...options.headers,
      },
      serviceConfig
    );

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorMessage = await parseErrorResponse(response, displayName);
      throw ServiceClientError.apiError(
        displayName,
        response.status,
        errorMessage
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  return {
    getConfig,
    request,
    displayName,
    serviceName,
  };
}
