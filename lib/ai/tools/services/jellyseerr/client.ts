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

  const url = `${config.baseUrl}/api/v1${endpoint}`;

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
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Ignore JSON parse errors
    }

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
export function getPosterUrl(posterPath: string | null | undefined): string | null {
  if (!posterPath) return null;
  return `https://image.tmdb.org/t/p/w500${posterPath}`;
}
