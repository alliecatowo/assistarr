/**
 * Unified error class for all service clients.
 * Provides consistent error handling patterns across Radarr, Sonarr, Jellyfin, etc.
 */
export class ServiceClientError extends Error {
  constructor(
    message: string,
    public readonly service: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "ServiceClientError";
  }

  /**
   * Create an error for when a service is not configured
   */
  static notConfigured(service: string): ServiceClientError {
    return new ServiceClientError(
      `${service} is not configured. Please configure ${service} in settings.`,
      service
    );
  }

  /**
   * Create an error for when a service is disabled
   */
  static disabled(service: string): ServiceClientError {
    return new ServiceClientError(
      `${service} is disabled. Please enable it in settings.`,
      service
    );
  }

  /**
   * Create an error for when API key is missing
   */
  static missingApiKey(service: string): ServiceClientError {
    return new ServiceClientError(
      `${service} API key is not configured. Please add your API key in settings.`,
      service
    );
  }

  /**
   * Create an error from an API response
   */
  static apiError(
    service: string,
    status: number,
    message: string
  ): ServiceClientError {
    return new ServiceClientError(message, service, status);
  }

  /**
   * Check if this is an authentication error
   */
  isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  /**
   * Check if this is a not found error
   */
  isNotFound(): boolean {
    return this.statusCode === 404;
  }

  /**
   * Check if this is a bad request error
   */
  isBadRequest(): boolean {
    return this.statusCode === 400;
  }
}

/**
 * Type guard to check if an error is a ServiceClientError
 */
export function isServiceClientError(
  error: unknown
): error is ServiceClientError {
  return error instanceof ServiceClientError;
}
