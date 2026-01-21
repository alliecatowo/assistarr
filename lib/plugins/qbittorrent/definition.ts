import type { ServiceConfig } from "@/lib/db/schema";
import { BaseServicePlugin } from "../base";
import type { ToolDefinition } from "../core/types";
import { QBittorrentClient } from "./client";
import { getTorrents } from "./get-torrents";
import { getTransferInfo } from "./get-transfer-info";
import { pauseResumeTorrent } from "./pause-resume-torrent";

class QBittorrentPlugin extends BaseServicePlugin {
  name = "qbittorrent";
  displayName = "qBittorrent";
  description = "Torrent client";
  iconId = "qbittorrent";

  protected toolsDefinitions: Record<string, ToolDefinition> = {
    getTorrents: this.defineTool(getTorrents, {
      displayName: "Get Torrents",
      description: "List and filter torrents",
      category: "download",
    }),
    getTransferInfo: this.defineTool(getTransferInfo, {
      displayName: "Transfer Info",
      description: "Global speed and data usage",
      category: "download",
    }),
    pauseResumeTorrent: this.defineTool(pauseResumeTorrent, {
      displayName: "Pause/Resume Torrent",
      description: "Control torrent state",
      category: "download",
      requiresApproval: true,
    }),
  };

  protected async performHealthCheck(config: ServiceConfig): Promise<boolean> {
    try {
      const client = new QBittorrentClient(config);
      await client.getAppVersion();
      return true;
    } catch {
      return false;
    }
  }
}

export const qbittorrentPlugin = new QBittorrentPlugin();
