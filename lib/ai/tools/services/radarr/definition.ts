import type { ServiceDefinition } from "../base";
import { addMovie } from "./add-movie";
import { getCalendar } from "./get-calendar";
import { getQueue } from "./get-queue";
import { searchMovies } from "./search-movies";

/**
 * Radarr service definition for the plugin system.
 * Radarr is a movie collection manager that can monitor and download movies.
 */
export const radarrService: ServiceDefinition = {
  name: "radarr",
  displayName: "Radarr",
  description:
    "Movie collection manager for monitoring, downloading, and organizing movies. Integrates with download clients and media servers.",
  tools: {
    searchMovies,
    addMovie,
    getRadarrQueue: getQueue,
    getRadarrCalendar: getCalendar,
  },
  healthCheck: async ({ config }) => {
    try {
      // Use the system/status endpoint to verify connectivity
      const response = await fetch(`${config.baseUrl}/api/v3/system/status`, {
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
