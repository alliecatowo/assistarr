import type { ServiceConfig } from "@/lib/db/schema";
import { BaseServicePlugin } from "../base";
import type { ToolDefinition } from "../core/types";
// Import tool factories (we will need to refactor these to use RadarrClient)
import { addMovie } from "./add-movie";
import { RadarrClient } from "./client";
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

export class RadarrPlugin extends BaseServicePlugin {
  name = "radarr";
  displayName = "Radarr";
  description =
    "Movie collection manager. Use this to manage the user's movie library.";
  iconId = "radarr";

  protected toolsDefinitions: Record<string, ToolDefinition> = {
    searchRadarrMovies: this.defineTool(searchMovies, {
      displayName: "Search Movies (Radarr)",
      category: "search",
      description: "Search for movies to add to Radarr",
      modes: ["chat"],
      metadata: {
        usage:
          "Use this to find movies to add to the library. Always show results to the user before adding.",
        examples: [
          "searchRadarrMovies('Dune')",
          "searchRadarrMovies('The Matrix')",
        ],
      },
    }),
    addRadarrMovie: this.defineTool(addMovie, {
      displayName: "Add Movie",
      category: "management",
      description: "Add a movie to the Radarr library",
      requiresApproval: true,
      modes: ["chat"],
    }),
    editRadarrMovie: this.defineTool(editMovie, {
      displayName: "Edit Movie",
      category: "management",
      description: "Edit a movie in the library",
      requiresApproval: true,
      modes: ["chat"],
    }),
    deleteRadarrMovie: this.defineTool(deleteMovie, {
      displayName: "Delete Movie",
      category: "management",
      description: "Remove a movie from the library",
      requiresApproval: true,
      modes: ["chat"],
    }),
    triggerRadarrSearch: this.defineTool(triggerSearch, {
      displayName: "Search Downloads (Radarr)",
      category: "download",
      description: "Trigger a search for downloads",
      modes: ["chat"],
    }),
    refreshRadarrMovie: this.defineTool(refreshMovie, {
      displayName: "Refresh Movie (Radarr)",
      category: "management",
      description: "Refresh movie metadata",
      modes: ["chat"],
    }),
    getRadarrLibrary: this.defineTool(getLibrary, {
      displayName: "Get Library (Radarr)",
      category: "library",
      description: "View movies in the library",
      modes: ["chat"],
      metadata: {
        usage:
          "Use this to browse the existing library. Supports filtering by genre, year, etc.",
        examples: [
          "getRadarrLibrary(genre: 'Comedy')",
          "getRadarrLibrary(year: 2023)",
        ],
      },
    }),
    getRadarrQualityProfiles: this.defineTool(getQualityProfiles, {
      displayName: "List Quality Profiles (Radarr)",
      category: "library",
      description: "View available quality profiles",
      modes: ["chat"],
    }),
    getRadarrQueue: this.defineTool(getQueue, {
      displayName: "View Queue (Radarr)",
      category: "queue",
      description: "View download queue",
      modes: ["chat"],
    }),
    getRadarrCalendar: this.defineTool(getCalendar, {
      displayName: "View Calendar (Radarr)",
      category: "calendar",
      description: "View upcoming releases",
      modes: ["chat"],
    }),
    getRadarrReleases: this.defineTool(getReleases, {
      displayName: "Get Releases (Radarr)",
      category: "download",
      description: "Find available releases for download",
      modes: ["chat"],
    }),
    grabRadarrRelease: this.defineTool(grabRelease, {
      displayName: "Grab Release (Radarr)",
      category: "download",
      description: "Download a specific release",
      requiresApproval: true,
      modes: ["chat"],
    }),
    removeFromRadarrQueue: this.defineTool(removeFromQueue, {
      displayName: "Remove from Queue (Radarr)",
      category: "queue",
      description: "Remove an item from the download queue",
      requiresApproval: true,
      modes: ["chat"],
    }),
    getRadarrManualImport: this.defineTool(getManualImport, {
      displayName: "Get Manual Import (Radarr)",
      category: "download",
      description: "List files available for manual import",
      modes: ["chat"],
    }),
    executeRadarrManualImport: this.defineTool(executeManualImport, {
      displayName: "Execute Manual Import (Radarr)",
      category: "download",
      description: "Import files and associate them with movies",
      requiresApproval: true,
      modes: ["chat"],
    }),
    scanRadarrDownloadedMovies: this.defineTool(scanDownloadedMovies, {
      displayName: "Scan Downloaded Movies (Radarr)",
      category: "download",
      description: "Scan download folder for new files",
      modes: ["chat"],
    }),
    getRadarrMovieFiles: this.defineTool(getMovieFiles, {
      displayName: "Get Movie Files (Radarr)",
      category: "library",
      description: "Get file information for movies",
      modes: ["chat"],
    }),
    renameRadarrMovieFiles: this.defineTool(renameMovieFiles, {
      displayName: "Rename Movie Files (Radarr)",
      category: "management",
      description: "Rename files to match naming convention",
      modes: ["chat"],
    }),
    deleteRadarrMovieFile: this.defineTool(deleteMovieFile, {
      displayName: "Delete Movie File (Radarr)",
      category: "management",
      description: "Delete a movie file from disk",
      requiresApproval: true,
      modes: ["chat"],
    }),
    getRadarrHistory: this.defineTool(getHistory, {
      displayName: "Get History (Radarr)",
      category: "library",
      description: "View download and import history",
      modes: ["chat"],
    }),
    markRadarrFailed: this.defineTool(markFailed, {
      displayName: "Mark Failed (Radarr)",
      category: "management",
      description: "Mark a download as failed for retry",
      modes: ["chat"],
    }),
    getRadarrBlocklist: this.defineTool(getBlocklist, {
      displayName: "Get Blocklist (Radarr)",
      category: "queue",
      description: "View blocklisted releases",
      modes: ["chat"],
    }),
    deleteRadarrBlocklist: this.defineTool(deleteBlocklist, {
      displayName: "Remove from Blocklist (Radarr)",
      category: "queue",
      description: "Remove items from the blocklist",
      modes: ["chat"],
    }),
    getRadarrCommandStatus: this.defineTool(getCommandStatus, {
      displayName: "Check Command Status (Radarr)",
      category: "management",
      description: "Check status of async commands like import/scan",
      modes: ["chat"],
    }),
  };

  protected async performHealthCheck(config: ServiceConfig): Promise<boolean> {
    const client = new RadarrClient(config);
    try {
      await client.get("/system/status");
      return true;
    } catch (_e) {
      return false;
    }
  }
}

export const radarrPlugin = new RadarrPlugin();
