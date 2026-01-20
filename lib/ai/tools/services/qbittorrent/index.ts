export { getTorrents } from "./get-torrents";
export { getTransferInfo } from "./get-transfer-info";
export { pauseResumeTorrent } from "./pause-resume-torrent";

// Re-export types for convenience
export type {
  Torrent,
  TorrentFilter,
  TorrentState,
  TransferInfo,
  ServerState,
  SyncMainData,
  ConnectionStatus,
} from "./types";

// Re-export client utilities
export {
  QBittorrentClientError,
  getQBittorrentConfig,
  qbittorrentRequest,
  qbittorrentPostForm,
  formatBytes,
  formatEta,
  getStateDescription,
} from "./client";
