import type { ServiceDefinition } from "../base";
import { getContinueWatching } from "./get-continue-watching";
import { getRecentlyAdded } from "./get-recently-added";
import { searchMedia } from "./search-media";

/**
 * Jellyfin service definition for the plugin system.
 * Jellyfin is a free media server for streaming movies, TV shows, and music.
 */
export const jellyfinService: ServiceDefinition = {
  name: "jellyfin",
  displayName: "Jellyfin",
  description:
    "Media server for streaming your personal collection of movies, TV shows, music, and more. Browse libraries and track watch progress.",
  tools: {
    getContinueWatching,
    getRecentlyAdded,
    searchMedia,
  },
  healthCheck: async ({ config }) => {
    try {
      const response = await fetch(`${config.baseUrl}/System/Info`, {
        headers: {
          Authorization: `MediaBrowser Token="${config.apiKey}"`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
