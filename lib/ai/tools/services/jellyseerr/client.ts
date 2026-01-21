import { getServiceConfig } from "@/lib/db/queries";
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
export async function getJellyseerrConfig(
  userId: string
): Promise<ServiceConfig | null> {
  return getServiceConfig({
    userId,
    serviceName: SERVICE_NAME,
  });
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

  // Validate API key is present
  if (!config.apiKey || config.apiKey.trim() === "") {
    throw new JellyseerrClientError(
      "Jellyseerr API key is not configured. Please add your API key in settings."
    );
  }

  // Normalize baseUrl - remove trailing slash if present
  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/api/v1${endpoint}`;

  console.log(`[Jellyseerr] Request: ${options.method || "GET"} ${url}`);

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
    let errorDetails: unknown = null;

    try {
      errorDetails = await response.json();

      // Handle different error response formats from Jellyseerr
      if (Array.isArray(errorDetails) && errorDetails.length > 0) {
        // Validation errors: [{ propertyName, errorMessage }]
        const validationErrors = (errorDetails as Array<{ errorMessage?: string; propertyName?: string }>)
          .filter((e) => e.errorMessage)
          .map((e) =>
            e.propertyName ? `${e.propertyName}: ${e.errorMessage}` : e.errorMessage
          );
        if (validationErrors.length > 0) {
          errorMessage = validationErrors.join("; ");
        }
      } else if (
        errorDetails &&
        typeof errorDetails === "object"
      ) {
        const errObj = errorDetails as Record<string, unknown>;
        if (errObj.message) {
          errorMessage = errObj.message as string;
        } else if (errObj.error) {
          errorMessage = errObj.error as string;
        } else if (errObj.errors && typeof errObj.errors === "object") {
          // Handle { errors: { field: ["message"] } } format
          const messages = Object.entries(errObj.errors as Record<string, string[]>)
            .flatMap(([field, msgs]) => msgs.map((msg) => `${field}: ${msg}`));
          if (messages.length > 0) {
            errorMessage = messages.join("; ");
          }
        }
      }
    } catch {
      // Ignore JSON parse errors
    }

    console.error(`[Jellyseerr] API Error:`, {
      status: response.status,
      statusText: response.statusText,
      url,
      errorDetails,
    });

    throw new JellyseerrClientError(errorMessage, response.status);
  }

  // Handle 204 No Content
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
