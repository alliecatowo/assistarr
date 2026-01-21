import { createHealthCheck, defineTool, type ServiceDefinition } from "../base";
import { addMovie } from "./add-movie";
import { deleteBlocklist } from "./delete-blocklist";
import { deleteMovie } from "./delete-movie";
import { deleteMovieFile } from "./delete-movie-file";
import { editMovie } from "./edit-movie";
import { executeManualImport } from "./execute-manual-import";
import { getBlocklist } from "./get-blocklist";
import { getCalendar } from "./get-calendar";
import { getCommandStatus } from "./get-command-status";
import { getHistory } from "./get-history";
import { getLibrary } from "./get-library";
import { getManualImport } from "./get-manual-import";
import { getMovieFiles } from "./get-movie-files";
import { getQualityProfiles } from "./get-quality-profiles";
import { getQueue } from "./get-queue";
import { getReleases } from "./get-releases";
import { grabRelease } from "./grab-release";
import { markFailed } from "./mark-failed";
import { refreshMovie } from "./refresh-movie";
import { removeFromQueue } from "./remove-from-queue";
import { renameMovieFiles } from "./rename-movie-files";
import { scanDownloadedMovies } from "./scan-downloaded-movies";
import { searchMovies } from "./search-movies";
import { triggerSearch } from "./trigger-search";

/**
 * Radarr service definition for the plugin system.
 * Radarr is a movie collection manager that can monitor and download movies.
 */
export const radarrService: ServiceDefinition = {
  name: "radarr",
  displayName: "Radarr",
  iconId: "radarr",
  description:
    "Movie collection manager. Use this to manage the user's movie library. ALWAYS use the search tools first to find IDs before performing actions like delete or edit. Use 'getLibrary' to see what is currently monitored. For stalled downloads, use 'getReleases' to find alternatives and 'grabRelease' to download them.",
  tools: {
    searchRadarrMovies: defineTool(searchMovies, {
      displayName: "Search Movies (Radarr)",
      category: "search",
      description: "Search for movies to add to Radarr",
    }),
    addRadarrMovie: defineTool(addMovie, {
      displayName: "Add Movie",
      category: "management",
      description: "Add a movie to the Radarr library",
      requiresApproval: true,
    }),
    editRadarrMovie: defineTool(editMovie, {
      displayName: "Edit Movie",
      category: "management",
      description: "Edit a movie in the library",
      requiresApproval: true,
    }),
    deleteRadarrMovie: defineTool(deleteMovie, {
      displayName: "Delete Movie",
      category: "management",
      description: "Remove a movie from the library",
      requiresApproval: true,
    }),
    triggerRadarrSearch: defineTool(triggerSearch, {
      displayName: "Search Downloads (Radarr)",
      category: "download",
      description: "Trigger a search for downloads",
    }),
    refreshRadarrMovie: defineTool(refreshMovie, {
      displayName: "Refresh Movie (Radarr)",
      category: "management",
      description: "Refresh movie metadata",
    }),
    getRadarrLibrary: defineTool(getLibrary, {
      displayName: "Get Library (Radarr)",
      category: "library",
      description: "View movies in the library",
    }),
    getRadarrQualityProfiles: defineTool(getQualityProfiles, {
      displayName: "List Quality Profiles (Radarr)",
      category: "library",
      description: "View available quality profiles",
    }),
    getRadarrQueue: defineTool(getQueue, {
      displayName: "View Queue (Radarr)",
      category: "queue",
      description: "View download queue",
    }),
    getRadarrCalendar: defineTool(getCalendar, {
      displayName: "View Calendar (Radarr)",
      category: "calendar",
      description: "View upcoming releases",
    }),
    getRadarrReleases: defineTool(getReleases, {
      displayName: "Get Releases (Radarr)",
      category: "download",
      description: "Find available releases for download",
    }),
    grabRadarrRelease: defineTool(grabRelease, {
      displayName: "Grab Release (Radarr)",
      category: "download",
      description: "Download a specific release",
      requiresApproval: true,
    }),
    removeFromRadarrQueue: defineTool(removeFromQueue, {
      displayName: "Remove from Queue (Radarr)",
      category: "queue",
      description: "Remove an item from the download queue",
      requiresApproval: true,
    }),
    getRadarrManualImport: defineTool(getManualImport, {
      displayName: "Get Manual Import (Radarr)",
      category: "download",
      description: "List files available for manual import",
    }),
    executeRadarrManualImport: defineTool(executeManualImport, {
      displayName: "Execute Manual Import (Radarr)",
      category: "download",
      description: "Import files and associate them with movies",
      requiresApproval: true,
    }),
    scanRadarrDownloadedMovies: defineTool(scanDownloadedMovies, {
      displayName: "Scan Downloaded Movies (Radarr)",
      category: "download",
      description: "Scan download folder for new files",
    }),
    getRadarrMovieFiles: defineTool(getMovieFiles, {
      displayName: "Get Movie Files (Radarr)",
      category: "library",
      description: "Get file information for movies",
    }),
    renameRadarrMovieFiles: defineTool(renameMovieFiles, {
      displayName: "Rename Movie Files (Radarr)",
      category: "management",
      description: "Rename files to match naming convention",
    }),
    deleteRadarrMovieFile: defineTool(deleteMovieFile, {
      displayName: "Delete Movie File (Radarr)",
      category: "management",
      description: "Delete a movie file from disk",
      requiresApproval: true,
    }),
    getRadarrHistory: defineTool(getHistory, {
      displayName: "Get History (Radarr)",
      category: "library",
      description: "View download and import history",
    }),
    markRadarrFailed: defineTool(markFailed, {
      displayName: "Mark Failed (Radarr)",
      category: "management",
      description: "Mark a download as failed for retry",
    }),
    getRadarrBlocklist: defineTool(getBlocklist, {
      displayName: "Get Blocklist (Radarr)",
      category: "queue",
      description: "View blocklisted releases",
    }),
    deleteRadarrBlocklist: defineTool(deleteBlocklist, {
      displayName: "Remove from Blocklist (Radarr)",
      category: "queue",
      description: "Remove items from the blocklist",
    }),
    getRadarrCommandStatus: defineTool(getCommandStatus, {
      displayName: "Check Command Status (Radarr)",
      category: "management",
      description: "Check status of async commands like import/scan",
    }),
  },
  healthCheck: createHealthCheck({
    type: "api-key-header",
    endpoint: "/api/v3/system/status",
    headerName: "X-Api-Key",
  }),
};
