import { createHealthCheck, defineTool, type ServiceDefinition } from "../base";
import { addSeries } from "./add-series";
import { deleteBlocklist } from "./delete-blocklist";
import { deleteEpisodeFile } from "./delete-episode-file";
import { deleteSeries } from "./delete-series";
import { editSeries } from "./edit-series";
import { executeManualImport } from "./execute-manual-import";
import { getBlocklist } from "./get-blocklist";
import { getCalendar } from "./get-calendar";
import { getEpisodeFiles } from "./get-episode-files";
import { getHistory } from "./get-history";
import { getLibrary } from "./get-library";
import { getManualImport } from "./get-manual-import";
import { getQualityProfiles } from "./get-quality-profiles";
import { getQueue } from "./get-queue";
import { getReleases } from "./get-releases";
import { grabRelease } from "./grab-release";
import { markFailed } from "./mark-failed";
import { refreshSeries } from "./refresh-series";
import { removeFromQueue } from "./remove-from-queue";
import { renameEpisodeFiles } from "./rename-episode-files";
import { scanDownloadedEpisodes } from "./scan-downloaded-episodes";
import { searchMissingEpisodes } from "./search-missing-episodes";
import { searchSeries } from "./search-series";
import { triggerSearch } from "./trigger-search";

/**
 * Sonarr service definition for the plugin system.
 * Sonarr is a PVR for Usenet and BitTorrent users.
 */
export const sonarrService: ServiceDefinition = {
  name: "sonarr",
  displayName: "Sonarr",
  iconId: "sonarr",
  description:
    "TV series collection manager. Use this to manage TV shows. ALWAYS search for a series first to get its ID before editing or deleting. Use 'getQualityProfiles' to see available options before adding shows. For stalled downloads, use 'getSonarrReleases' to find alternatives and 'grabSonarrRelease' to download them.",
  tools: {
    // Read operations
    getSonarrLibrary: defineTool(getLibrary, {
      displayName: "Get Library (Sonarr)",
      category: "library",
      description: "View TV series in the library",
    }),
    getSonarrQualityProfiles: defineTool(getQualityProfiles, {
      displayName: "List Quality Profiles (Sonarr)",
      category: "library",
      description: "View available quality profiles",
    }),
    getSonarrQueue: defineTool(getQueue, {
      displayName: "View Queue (Sonarr)",
      category: "queue",
      description: "View download queue",
    }),
    getSonarrCalendar: defineTool(getCalendar, {
      displayName: "View Calendar (Sonarr)",
      category: "calendar",
      description: "View upcoming episodes",
    }),
    searchSonarrSeries: defineTool(searchSeries, {
      displayName: "Search TV (Sonarr)",
      category: "search",
      description: "Search for TV series to add",
    }),
    getSonarrReleases: defineTool(getReleases, {
      displayName: "Get Releases (Sonarr)",
      category: "download",
      description: "Find available releases for download",
    }),
    getSonarrHistory: defineTool(getHistory, {
      displayName: "View History (Sonarr)",
      category: "history",
      description: "View download and import history",
    }),
    getSonarrBlocklist: defineTool(getBlocklist, {
      displayName: "View Blocklist (Sonarr)",
      category: "blocklist",
      description: "View blocklisted releases",
    }),
    getSonarrEpisodeFiles: defineTool(getEpisodeFiles, {
      displayName: "Get Episode Files (Sonarr)",
      category: "library",
      description: "Get episode file information",
    }),
    getSonarrManualImport: defineTool(getManualImport, {
      displayName: "Get Manual Import (Sonarr)",
      category: "import",
      description: "List files available for manual import",
    }),
    // Write operations
    addSonarrSeries: defineTool(addSeries, {
      displayName: "Add Series",
      category: "management",
      description: "Add a TV series to the library",
      requiresApproval: true,
    }),
    editSonarrSeries: defineTool(editSeries, {
      displayName: "Edit Series",
      category: "management",
      description: "Edit a series in the library",
      requiresApproval: true,
    }),
    deleteSonarrSeries: defineTool(deleteSeries, {
      displayName: "Delete Series",
      category: "management",
      description: "Remove a series from the library",
      requiresApproval: true,
    }),
    triggerSonarrSearch: defineTool(triggerSearch, {
      displayName: "Search Downloads (Sonarr)",
      category: "download",
      description: "Trigger a search for downloads",
    }),
    refreshSonarrSeries: defineTool(refreshSeries, {
      displayName: "Refresh Series (Sonarr)",
      category: "management",
      description: "Refresh series metadata",
    }),
    grabSonarrRelease: defineTool(grabRelease, {
      displayName: "Grab Release (Sonarr)",
      category: "download",
      description: "Download a specific release",
      requiresApproval: true,
    }),
    removeFromSonarrQueue: defineTool(removeFromQueue, {
      displayName: "Remove from Queue (Sonarr)",
      category: "queue",
      description: "Remove an item from the download queue",
      requiresApproval: true,
    }),
    executeSonarrManualImport: defineTool(executeManualImport, {
      displayName: "Execute Manual Import (Sonarr)",
      category: "import",
      description: "Import files with manual episode matching",
      requiresApproval: true,
    }),
    scanSonarrDownloadedEpisodes: defineTool(scanDownloadedEpisodes, {
      displayName: "Scan Downloaded Episodes (Sonarr)",
      category: "import",
      description: "Scan download folder for new episodes",
    }),
    renameSonarrEpisodeFiles: defineTool(renameEpisodeFiles, {
      displayName: "Rename Episode Files (Sonarr)",
      category: "management",
      description: "Rename episode files to proper format",
    }),
    deleteSonarrEpisodeFile: defineTool(deleteEpisodeFile, {
      displayName: "Delete Episode File (Sonarr)",
      category: "management",
      description: "Delete an episode file from disk",
      requiresApproval: true,
    }),
    markSonarrFailed: defineTool(markFailed, {
      displayName: "Mark Failed (Sonarr)",
      category: "history",
      description: "Mark a download as failed",
    }),
    deleteSonarrBlocklist: defineTool(deleteBlocklist, {
      displayName: "Remove from Blocklist (Sonarr)",
      category: "blocklist",
      description: "Remove a release from the blocklist",
      requiresApproval: true,
    }),
    searchSonarrMissingEpisodes: defineTool(searchMissingEpisodes, {
      displayName: "Search Missing Episodes (Sonarr)",
      category: "download",
      description: "Search for all missing monitored episodes",
    }),
  },
  healthCheck: createHealthCheck({
    type: "api-key-header",
    endpoint: "/api/v3/system/status",
    headerName: "X-Api-Key",
  }),
};
