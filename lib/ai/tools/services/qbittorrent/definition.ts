import { createHealthCheck, defineTool, type ServiceDefinition } from "../base";
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
  iconId: "qbittorrent",
  description:
    "BitTorrent download client. View active downloads, monitor transfer speeds, and control torrent states.",
  tools: {
    getTorrents: defineTool(getTorrents, {
      displayName: "View Torrents",
      category: "queue",
      description: "View active and completed torrents",
    }),
    getTransferInfo: defineTool(getTransferInfo, {
      displayName: "Transfer Stats",
      category: "queue",
      description: "View download and upload speeds",
    }),
    pauseResumeTorrent: defineTool(pauseResumeTorrent, {
      displayName: "Control Torrent",
      category: "download",
      description: "Pause or resume a torrent",
      requiresApproval: true,
    }),
  },
  healthCheck: createHealthCheck({
    type: "form-login",
    endpoint: "/api/v2/auth/login",
    successResponse: "Ok.",
  }),
};
