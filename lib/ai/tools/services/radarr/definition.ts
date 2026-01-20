import type { ServiceDefinition } from "../base";
import { addMovie } from "./add-movie";
import { deleteMovie } from "./delete-movie";
import { editMovie } from "./edit-movie";
import { getLibrary } from "./get-library";
import { getQualityProfiles } from "./get-quality-profiles";
import { getQueue } from "./get-queue";
import { getReleases } from "./get-releases";
import { grabRelease } from "./grab-release";
import { refreshMovie } from "./refresh-movie";
import { removeFromQueue } from "./remove-from-queue";
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
    "Movie collection manager. Use this to manage the user's movie library. ALWAYS use the search tools first to find IDs before performing actions like delete or edit. Use 'getLibrary' to see what is currently monitored. For stalled downloads, use 'getReleases' to find alternatives and 'grabRelease' to download them.",
  tools: {
    searchRadarrMovies: searchMovies,
    addRadarrMovie: addMovie,
    editRadarrMovie: editMovie,
    deleteRadarrMovie: deleteMovie,
    triggerRadarrSearch: triggerSearch,
    refreshRadarrMovie: refreshMovie,
    getRadarrLibrary: getLibrary,
    getRadarrQualityProfiles: getQualityProfiles,
    getRadarrQueue: getQueue,
    getRadarrReleases: getReleases,
    grabRadarrRelease: grabRelease,
    removeFromRadarrQueue: removeFromQueue,
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
