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
      modes: ["chat"],
    }),
    addSonarrSeries: this.defineTool(addSeries, {
      displayName: "Add Series",
      category: "management",
      description: "Add a TV series to the Sonarr library",
      requiresApproval: true,
      modes: ["chat"],
    }),
    editSonarrSeries: this.defineTool(editSeries, {
      displayName: "Edit Series",
      category: "management",
      description: "Edit a series in the library",
      requiresApproval: true,
      modes: ["chat"],
    }),
    deleteSonarrSeries: this.defineTool(deleteSeries, {
      displayName: "Delete Series",
      category: "management",
      description: "Remove a series from the library",
      requiresApproval: true,
      modes: ["chat"],
    }),
    triggerSonarrSearch: this.defineTool(triggerSearch, {
      displayName: "Search Downloads (Sonarr)",
      category: "download",
      description: "Trigger a search for downloads",
      modes: ["chat"],
    }),
    refreshSonarrSeries: this.defineTool(refreshSeries, {
      displayName: "Refresh Series (Sonarr)",
      category: "management",
      description: "Refresh series metadata",
      modes: ["chat"],
    }),
    getSonarrLibrary: this.defineTool(getLibrary, {
      displayName: "Get Library (Sonarr)",
      category: "library",
      description: "View series in the library",
      modes: ["chat"],
    }),
    getSonarrQualityProfiles: this.defineTool(getQualityProfiles, {
      displayName: "List Quality Profiles (Sonarr)",
      category: "library",
      description: "View available quality profiles",
      modes: ["chat"],
    }),
    getSonarrQueue: this.defineTool(getQueue, {
      displayName: "View Queue (Sonarr)",
      category: "queue",
      description: "View download queue",
      modes: ["chat"],
    }),
    getSonarrCalendar: this.defineTool(getCalendar, {
      displayName: "View Calendar (Sonarr)",
      category: "calendar",
      description: "View upcoming episodes",
      modes: ["chat"],
    }),
    getSonarrReleases: this.defineTool(getReleases, {
      displayName: "Get Releases (Sonarr)",
      category: "download",
      description: "Find available releases for download",
      modes: ["chat"],
    }),
    grabSonarrRelease: this.defineTool(grabRelease, {
      displayName: "Grab Release (Sonarr)",
      category: "download",
      description: "Download a specific release",
      requiresApproval: true,
      modes: ["chat"],
    }),
    removeFromSonarrQueue: this.defineTool(removeFromQueue, {
      displayName: "Remove from Queue (Sonarr)",
      category: "queue",
      description: "Remove an item from the download queue",
      requiresApproval: true,
      modes: ["chat"],
    }),
    getSonarrManualImport: this.defineTool(getManualImport, {
      displayName: "Get Manual Import (Sonarr)",
      category: "download",
      description: "List files available for manual import",
      modes: ["chat"],
    }),
    executeSonarrManualImport: this.defineTool(executeManualImport, {
      displayName: "Execute Manual Import (Sonarr)",
      category: "download",
      description: "Import files and associate them with episodes",
      requiresApproval: true,
      modes: ["chat"],
    }),
    scanSonarrDownloadedEpisodes: this.defineTool(scanDownloadedEpisodes, {
      displayName: "Scan Downloaded Episodes (Sonarr)",
      category: "download",
      description: "Scan download folder for new files",
      modes: ["chat"],
    }),
    searchSonarrMissingEpisodes: this.defineTool(searchMissingEpisodes, {
      displayName: "Search Missing Episodes (Sonarr)",
      category: "download",
      description: "Trigger search for all missing episodes",
      modes: ["chat"],
    }),
    getSonarrEpisodeFiles: this.defineTool(getEpisodeFiles, {
      displayName: "Get Episode Files (Sonarr)",
      category: "library",
      description: "Get file information for episodes",
      modes: ["chat"],
    }),
    renameSonarrEpisodeFiles: this.defineTool(renameEpisodeFiles, {
      displayName: "Rename Episode Files (Sonarr)",
      category: "management",
      description: "Rename files to match naming convention",
      modes: ["chat"],
    }),
    deleteSonarrEpisodeFile: this.defineTool(deleteEpisodeFile, {
      displayName: "Delete Episode File (Sonarr)",
      category: "management",
      description: "Delete an episode file from disk",
      requiresApproval: true,
      modes: ["chat"],
    }),
    getSonarrHistory: this.defineTool(getHistory, {
      displayName: "Get History (Sonarr)",
      category: "library",
      description: "View download and import history",
      modes: ["chat"],
    }),
    markSonarrFailed: this.defineTool(markFailed, {
      displayName: "Mark Failed (Sonarr)",
      category: "management",
      description: "Mark a download as failed for retry",
      modes: ["chat"],
    }),
    getSonarrBlocklist: this.defineTool(getBlocklist, {
      displayName: "Get Blocklist (Sonarr)",
      category: "queue",
      description: "View blocklisted releases",
      modes: ["chat"],
    }),
    deleteSonarrBlocklist: this.defineTool(deleteBlocklist, {
      displayName: "Remove from Blocklist (Sonarr)",
      category: "queue",
      description: "Remove items from the blocklist",
      modes: ["chat"],
    }),
    getSonarrCommandStatus: this.defineTool(getCommandStatus, {
      displayName: "Check Command Status (Sonarr)",
      category: "management",
      description: "Check status of async commands like import/scan",
      modes: ["chat"],
    }),
  };

  protected async performHealthCheck(config: ServiceConfig): Promise<boolean> {
    const client = new SonarrClient(config);
    try {
      await client.get("/system/status");
      return true;
    } catch {
      return false;
    }
  }
}

export const sonarrPlugin = new SonarrPlugin();
