import type { ServiceDefinition } from "../base";
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
  description:
    "TV series collection manager. Use this to manage TV shows. ALWAYS search for a series first to get its ID before editing or deleting. Use 'getQualityProfiles' to see available options before adding shows. For stalled downloads, use 'getSonarrReleases' to find alternatives and 'grabSonarrRelease' to download them.",
  tools: {
    // Read operations
    getSonarrLibrary: getLibrary,
    getSonarrQualityProfiles: getQualityProfiles,
    getSonarrQueue: getQueue,
    getSonarrCalendar: getCalendar,
    searchSonarrSeries: searchSeries,
    getSonarrReleases: getReleases,
    // Write operations
    addSonarrSeries: addSeries,
    editSonarrSeries: editSeries,
    deleteSonarrSeries: deleteSeries,
    triggerSonarrSearch: triggerSearch,
    refreshSonarrSeries: refreshSeries,
    grabSonarrRelease: grabRelease,
    removeFromSonarrQueue: removeFromQueue,
  },
  healthCheck: async ({ config }) => {
    try {
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
