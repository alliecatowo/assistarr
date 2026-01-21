import type { ServiceConfig } from "@/lib/db/schema";
import { BaseServicePlugin } from "../base";
import type { ToolDefinition } from "../core/types";
import { addSeries } from "./add-series";
import { SonarrClient } from "./client";
import { deleteBlocklist } from "./delete-blocklist";
import { deleteEpisodeFile } from "./delete-episode-file";
import { deleteSeries } from "./delete-series";
import { editSeries } from "./edit-series";
import { executeManualImport } from "./execute-manual-import";
import { getBlocklist } from "./get-blocklist";
import { getCalendar } from "./get-calendar";
import { getCommandStatus } from "./get-command-status";
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

export class SonarrPlugin extends BaseServicePlugin {
  name = "sonarr";
  displayName = "Sonarr";
  description =
    "TV series collection manager. Use this to manage the user's TV show library.";
  iconId = "sonarr";

  protected toolsDefinitions: Record<string, ToolDefinition> = {
    searchSonarrSeries: this.defineTool(searchSeries, {
      displayName: "Search Series (Sonarr)",
      category: "search",
      description: "Search for TV series to add to Sonarr",
    }),
    addSonarrSeries: this.defineTool(addSeries, {
      displayName: "Add Series",
      category: "management",
      description: "Add a TV series to the Sonarr library",
      requiresApproval: true,
    }),
    editSonarrSeries: this.defineTool(editSeries, {
      displayName: "Edit Series",
      category: "management",
      description: "Edit a series in the library",
      requiresApproval: true,
    }),
    deleteSonarrSeries: this.defineTool(deleteSeries, {
      displayName: "Delete Series",
      category: "management",
      description: "Remove a series from the library",
      requiresApproval: true,
    }),
    triggerSonarrSearch: this.defineTool(triggerSearch, {
      displayName: "Search Downloads (Sonarr)",
      category: "download",
      description: "Trigger a search for downloads",
    }),
    refreshSonarrSeries: this.defineTool(refreshSeries, {
      displayName: "Refresh Series (Sonarr)",
      category: "management",
      description: "Refresh series metadata",
    }),
    getSonarrLibrary: this.defineTool(getLibrary, {
      displayName: "Get Library (Sonarr)",
      category: "library",
      description: "View series in the library",
    }),
    getSonarrQualityProfiles: this.defineTool(getQualityProfiles, {
      displayName: "List Quality Profiles (Sonarr)",
      category: "library",
      description: "View available quality profiles",
    }),
    getSonarrQueue: this.defineTool(getQueue, {
      displayName: "View Queue (Sonarr)",
      category: "queue",
      description: "View download queue",
    }),
    getSonarrCalendar: this.defineTool(getCalendar, {
      displayName: "View Calendar (Sonarr)",
      category: "calendar",
      description: "View upcoming episodes",
    }),
    getSonarrReleases: this.defineTool(getReleases, {
      displayName: "Get Releases (Sonarr)",
      category: "download",
      description: "Find available releases for download",
    }),
    grabSonarrRelease: this.defineTool(grabRelease, {
      displayName: "Grab Release (Sonarr)",
      category: "download",
      description: "Download a specific release",
      requiresApproval: true,
    }),
    removeFromSonarrQueue: this.defineTool(removeFromQueue, {
      displayName: "Remove from Queue (Sonarr)",
      category: "queue",
      description: "Remove an item from the download queue",
      requiresApproval: true,
    }),
    getSonarrManualImport: this.defineTool(getManualImport, {
      displayName: "Get Manual Import (Sonarr)",
      category: "download",
      description: "List files available for manual import",
    }),
    executeSonarrManualImport: this.defineTool(executeManualImport, {
      displayName: "Execute Manual Import (Sonarr)",
      category: "download",
      description: "Import files and associate them with episodes",
      requiresApproval: true,
    }),
    scanSonarrDownloadedEpisodes: this.defineTool(scanDownloadedEpisodes, {
      displayName: "Scan Downloaded Episodes (Sonarr)",
      category: "download",
      description: "Scan download folder for new files",
    }),
    searchSonarrMissingEpisodes: this.defineTool(searchMissingEpisodes, {
      displayName: "Search Missing Episodes (Sonarr)",
      category: "download",
      description: "Trigger search for all missing episodes",
    }),
    getSonarrEpisodeFiles: this.defineTool(getEpisodeFiles, {
      displayName: "Get Episode Files (Sonarr)",
      category: "library",
      description: "Get file information for episodes",
    }),
    renameSonarrEpisodeFiles: this.defineTool(renameEpisodeFiles, {
      displayName: "Rename Episode Files (Sonarr)",
      category: "management",
      description: "Rename files to match naming convention",
    }),
    deleteSonarrEpisodeFile: this.defineTool(deleteEpisodeFile, {
      displayName: "Delete Episode File (Sonarr)",
      category: "management",
      description: "Delete an episode file from disk",
      requiresApproval: true,
    }),
    getSonarrHistory: this.defineTool(getHistory, {
      displayName: "Get History (Sonarr)",
      category: "library",
      description: "View download and import history",
    }),
    markSonarrFailed: this.defineTool(markFailed, {
      displayName: "Mark Failed (Sonarr)",
      category: "management",
      description: "Mark a download as failed for retry",
    }),
    getSonarrBlocklist: this.defineTool(getBlocklist, {
      displayName: "Get Blocklist (Sonarr)",
      category: "queue",
      description: "View blocklisted releases",
    }),
    deleteSonarrBlocklist: this.defineTool(deleteBlocklist, {
      displayName: "Remove from Blocklist (Sonarr)",
      category: "queue",
      description: "Remove items from the blocklist",
    }),
    getSonarrCommandStatus: this.defineTool(getCommandStatus, {
      displayName: "Check Command Status (Sonarr)",
      category: "management",
      description: "Check status of async commands like import/scan",
    }),
  };

  protected async performHealthCheck(config: ServiceConfig): Promise<boolean> {
    const client = new SonarrClient(config);
    try {
      await client.get("/api/v3/system/status");
      return true;
    } catch {
      return false;
    }
  }
}

export const sonarrPlugin = new SonarrPlugin();
