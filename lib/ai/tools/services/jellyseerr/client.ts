import { getServiceConfig } from "@/lib/db/queries/index";
import type { ServiceConfig } from "@/lib/db/schema";

const SERVICE_NAME = "jellyseerr";

export class JellyseerrClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "JellyseerrClientError";
  }
}

/**
 * Get Jellyseerr service configuration for a user
 */
export function getJellyseerrConfig(
  userId: string
): Promise<ServiceConfig | null> {
  return getServiceConfig({
    userId,
    serviceName: SERVICE_NAME,
  });
}

/**
 * Parse error response into a message
 */
function parseValidationErrors(errorDetails: unknown[]): string | null {
  const validationErrors = (
    errorDetails as Array<{ errorMessage?: string; propertyName?: string }>
  )
    .filter((e) => e.errorMessage)
    .map((e) =>
      e.propertyName ? `${e.propertyName}: ${e.errorMessage}` : e.errorMessage
    );
  return validationErrors.length > 0 ? validationErrors.join("; ") : null;
}

function parseObjectError(errObj: Record<string, unknown>): string | null {
  if (errObj.message) {
    return errObj.message as string;
  }
  if (errObj.error) {
    return errObj.error as string;
  }

  if (errObj.errors && typeof errObj.errors === "object") {
    const messages = Object.entries(
      errObj.errors as Record<string, string[]>
    ).flatMap(([field, msgs]) => msgs.map((msg) => `${field}: ${msg}`));
    if (messages.length > 0) {
      return messages.join("; ");
    }
  }

  return null;
}

function parseErrorDetails(errorDetails: unknown): string | null {
  if (Array.isArray(errorDetails) && errorDetails.length > 0) {
    return parseValidationErrors(errorDetails);
  }

  if (errorDetails && typeof errorDetails === "object") {
    return parseObjectError(errorDetails as Record<string, unknown>);
  }

  return null;
}

/**
 * Make an authenticated request to the Jellyseerr API
 */
export async function jellyseerrRequest<T>(
  userId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = await getJellyseerrConfig(userId);

  if (!config) {
    throw new JellyseerrClientError(
      "Jellyseerr is not configured. Please configure Jellyseerr in settings."
    );
  }

  if (!config.isEnabled) {
    throw new JellyseerrClientError(
      "Jellyseerr is disabled. Please enable it in settings."
    );
  }

  if (!config.apiKey || config.apiKey.trim() === "") {
    throw new JellyseerrClientError(
      "Jellyseerr API key is not configured. Please add your API key in settings."
    );
  }

  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/api/v1${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "X-Api-Key": config.apiKey,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `Jellyseerr API error: ${response.status} ${response.statusText}`;

    try {
      const errorDetails = await response.json();
      const parsed = parseErrorDetails(errorDetails);
      if (parsed) {
        errorMessage = parsed;
      }
    } catch {
      // Ignore JSON parse errors
    }

    throw new JellyseerrClientError(errorMessage, response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Build poster URL from Jellyseerr/TMDB poster path
 */
export function getPosterUrl(
  posterPath: string | null | undefined
): string | null {
  if (!posterPath) {
    return null;
  }
  return `https://image.tmdb.org/t/p/w500${posterPath}`;
}
