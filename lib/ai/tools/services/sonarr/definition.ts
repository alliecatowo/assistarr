import { createHealthCheck, defineTool, type ServiceDefinition } from "../base";
import { addSeries } from "./add-series";
import { deleteSeries } from "./delete-series";
import { editSeries } from "./edit-series";
import { getCalendar } from "./get-calendar";
import { getLibrary } from "./get-library";
import { getQualityProfiles } from "./get-quality-profiles";
import { getQueue } from "./get-queue";
import { getReleases } from "./get-releases";
import { grabRelease } from "./grab-release";
import { refreshSeries } from "./refresh-series";
import { removeFromQueue } from "./remove-from-queue";
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
  },
  healthCheck: createHealthCheck({
    type: "api-key-header",
    endpoint: "/api/v3/system/status",
    headerName: "X-Api-Key",
  }),
};
