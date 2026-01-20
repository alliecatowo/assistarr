import type { ServiceDefinition } from "../base";
import { deleteRequest } from "./delete-request";
import { getDiscovery } from "./get-discovery";
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
    "Media request system. Use this to check for pending requests, search for new content to request, and view what's trending. Use 'searchContent' to check availability before requests.",
  tools: {
    searchContent,
    requestMedia,
    getRequests,
    deleteRequest,
    getDiscovery,
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
