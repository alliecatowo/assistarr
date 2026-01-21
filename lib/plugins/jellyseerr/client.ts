import { ApiClient } from "../core/client";

export class JellyseerrClient extends ApiClient {
  // Add Jellyseerr-specific methods if needed, or just use generic get/post/put/delete

  getStatus() {
    return this.get<{ version: string }>("/api/v1/status");
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
