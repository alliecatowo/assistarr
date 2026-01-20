import type { ServiceDefinition } from "../base";
import { getRequests } from "./get-requests";
import { requestMedia } from "./request-media";
import { searchContent } from "./search-content";

/**
 * Jellyseerr service definition for the plugin system.
 * Jellyseerr is a request management system for Plex, Jellyfin, and Emby.
 */
export const jellyseerrService: ServiceDefinition = {
  name: "jellyseerr",
  displayName: "Jellyseerr",
  description:
    "Media request management system. Search for movies and TV shows, submit requests, and track request status.",
  tools: {
    searchContent,
    requestMedia,
    getRequests,
  },
  healthCheck: async ({ config }) => {
    try {
      const response = await fetch(`${config.baseUrl}/api/v1/status`, {
        headers: {
          "X-Api-Key": config.apiKey,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
