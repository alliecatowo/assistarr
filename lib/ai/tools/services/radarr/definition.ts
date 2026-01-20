import type { ServiceDefinition } from "../base";
import { addMovie } from "./add-movie";
import { deleteMovie } from "./delete-movie";
import { editMovie } from "./edit-movie";
import { getCalendar } from "./get-calendar";
import { getLibrary } from "./get-library";
import { getQualityProfiles } from "./get-quality-profiles";
import { getQueue } from "./get-queue";
import { searchMovies } from "./search-movies";
import { triggerSearch } from "./trigger-search";

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
    // Read operations
    getRadarrLibrary: getLibrary,
    getRadarrQualityProfiles: getQualityProfiles,
    getRadarrQueue: getQueue,
    getRadarrCalendar: getCalendar,
    searchRadarrMovies: searchMovies,
    // Write operations
    addRadarrMovie: addMovie,
    editRadarrMovie: editMovie,
    deleteRadarrMovie: deleteMovie,
    triggerRadarrSearch: triggerSearch,
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
