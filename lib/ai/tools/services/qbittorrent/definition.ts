import type { ServiceDefinition } from "../base";
import { getTorrents } from "./get-torrents";
import { getTransferInfo } from "./get-transfer-info";
import { pauseResumeTorrent } from "./pause-resume-torrent";

/**
 * qBittorrent service definition for the plugin system.
 * qBittorrent is a BitTorrent client for downloading and managing torrents.
 */
export const qbittorrentService: ServiceDefinition = {
  name: "qbittorrent",
  displayName: "qBittorrent",
  description:
    "BitTorrent download client. View active downloads, monitor transfer speeds, and control torrent states.",
  tools: {
    getTorrents,
    getTransferInfo,
    pauseResumeTorrent,
  },
  healthCheck: async ({ config }) => {
    try {
      // Parse credentials (format: "username:password")
      const colonIndex = config.apiKey.indexOf(":");
      if (colonIndex === -1) {
        return false;
      }
      const username = config.apiKey.substring(0, colonIndex);
      const password = config.apiKey.substring(colonIndex + 1);

      // Try to login
      const response = await fetch(
        `${config.baseUrl.replace(/\/$/, "")}/api/v2/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ username, password }),
        }
      );

      const text = await response.text();
      return text === "Ok.";
    } catch {
      return false;
    }
  },
};
