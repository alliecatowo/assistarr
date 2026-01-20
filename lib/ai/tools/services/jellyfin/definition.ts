import { createHealthCheck, defineTool, type ServiceDefinition } from "../base";
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
  iconId: "jellyfin",
  description:
    "Media server for streaming your personal collection of movies, TV shows, music, and more. Browse libraries and track watch progress.",
  tools: {
    getContinueWatching: defineTool(getContinueWatching, {
      displayName: "Continue Watching (Jellyfin)",
      category: "playback",
      description: "View items you're currently watching",
    }),
    getRecentlyAdded: defineTool(getRecentlyAdded, {
      displayName: "Recently Added (Jellyfin)",
      category: "library",
      description: "View recently added media",
    }),
    searchJellyfinMedia: defineTool(searchMedia, {
      displayName: "Search Media (Jellyfin)",
      category: "search",
      description: "Search your media library",
    }),
  },
  healthCheck: createHealthCheck({
    type: "bearer-token",
    endpoint: "/System/Info",
    tokenTemplate: 'MediaBrowser Token="{apiKey}"',
  }),
};
