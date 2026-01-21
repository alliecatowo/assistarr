import { ApiClient } from "../core/client";

export class JellyfinClient extends ApiClient {
  getStatus() {
    return this.get<{ version: string }>("/status");
  }

  protected getHeaders(): Promise<HeadersInit> {
    return Promise.resolve({
      "X-Emby-Token": this.config.apiKey || "",
      Authorization: `MediaBrowser Token="${this.config.apiKey}"`,
      "Content-Type": "application/json",
    });
  }
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
