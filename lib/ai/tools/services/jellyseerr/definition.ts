import { createHealthCheck, defineTool, type ServiceDefinition } from "../base";
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
  iconId: "jellyseerr",
  description:
    "Media request system. Use this to check for pending requests, search for new content to request, and view what's trending. Use 'searchContent' to check availability before requests.",
  tools: {
    searchContent: defineTool(searchContent, {
      displayName: "Search Media (Jellyseerr)",
      category: "search",
      description: "Search for movies and TV shows",
    }),
    requestMedia: defineTool(requestMedia, {
      displayName: "Request Media",
      category: "request",
      description: "Request a movie or TV show",
      requiresApproval: true,
    }),
    getRequests: defineTool(getRequests, {
      displayName: "View Requests",
      category: "request",
      description: "View pending media requests",
    }),
    deleteRequest: defineTool(deleteRequest, {
      displayName: "Delete Request",
      category: "request",
      description: "Remove a media request",
      requiresApproval: true,
    }),
    getDiscovery: defineTool(getDiscovery, {
      displayName: "Discover Content",
      category: "discovery",
      description: "Explore trending and popular content",
    }),
  },
  healthCheck: createHealthCheck({
    type: "api-key-header",
    endpoint: "/api/v1/status",
    headerName: "X-Api-Key",
  }),
};
