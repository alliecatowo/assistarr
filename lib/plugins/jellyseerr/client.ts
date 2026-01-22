import { ApiClient } from "../core/client";

export class JellyseerrClient extends ApiClient {
  // Jellyseerr uses /api/v1 prefix for all endpoints
  protected readonly apiPrefix = "/api/v1";

  getStatus() {
    return this.get<{ version: string }>("/status");
  }
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
