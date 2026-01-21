import { getServiceConfig } from "@/lib/db/queries";
import type { ServiceConfig } from "@/lib/db/schema";

const SERVICE_NAME = "jellyfin";

export interface JellyfinConfig {
  baseUrl: string;
  apiKey: string;
  userId?: string;
}

export class JellyfinClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "JellyfinClientError";
  }
}

/**
 * Get Jellyfin service configuration for a user
 */
export function getJellyfinConfig(
  userId: string
): Promise<ServiceConfig | null> {
  return getServiceConfig({
    userId,
    serviceName: SERVICE_NAME,
  });
}

/**
 * Build the authorization header for Jellyfin API requests
 */
function buildAuthHeader(apiKey: string): string {
  return `MediaBrowser Token="${apiKey}"`;
}

/**
 * Parse Jellyfin error response into a readable message
 */
function parseJellyfinError(errorData: unknown): string | null {
  if (Array.isArray(errorData) && errorData.length > 0) {
    const validationErrors = errorData
      .filter((e: { errorMessage?: string }) => e.errorMessage)
      .map((e: { propertyName?: string; errorMessage: string }) =>
        e.propertyName ? `${e.propertyName}: ${e.errorMessage}` : e.errorMessage
      );
    if (validationErrors.length > 0) {
      return validationErrors.join("; ");
    }
  }

  if (errorData && typeof errorData === "object") {
    const errObj = errorData as Record<string, unknown>;
    if (errObj.message) {
      return errObj.message as string;
    }
    if (errObj.Message) {
      return errObj.Message as string;
    }
    if (errObj.error) {
      return errObj.error as string;
    }
  }

  return null;
}

/**
 * Make an authenticated request to the Jellyfin API
 */
export async function jellyfinRequest<T>(
  config: JellyfinConfig,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${config.baseUrl}${endpoint}`;

  const headers: HeadersInit = {
    Authorization: buildAuthHeader(config.apiKey),
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Jellyfin API error: ${response.status} ${response.statusText}`;

    try {
      const errorData = await response.json();
      const parsed = parseJellyfinError(errorData);
      if (parsed) {
        errorMessage = parsed;
      }
    } catch {
      // Ignore JSON parsing errors for error response
    }

    throw new JellyfinClientError(errorMessage, response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Helper to convert Jellyfin ticks to human-readable time
 * Jellyfin uses ticks (1 tick = 100 nanoseconds)
 */
export function ticksToMinutes(ticks: number): number {
  return Math.floor(ticks / 600_000_000);
}

export function ticksToSeconds(ticks: number): number {
  return Math.floor(ticks / 10_000_000);
}

export function formatDuration(ticks: number): string {
  const totalMinutes = ticksToMinutes(ticks);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Calculate playback progress percentage
 */
export function calculateProgressPercentage(
  positionTicks: number,
  totalTicks: number
): number {
  if (totalTicks === 0) {
    return 0;
  }
  return Math.round((positionTicks / totalTicks) * 100);
}

/**
 * Build image URL for a Jellyfin item
 */
export function getImageUrl(
  baseUrl: string,
  itemId: string,
  imageTag?: string,
  width = 300
): string | null {
  if (!imageTag) {
    return null;
  }
  return `${baseUrl}/Items/${itemId}/Images/Primary?tag=${imageTag}&fillWidth=${width}`;
}
