/**
 * TypeScript types for qBittorrent API responses
 */

/**
 * Torrent state values
 */
export type TorrentState =
  | "error"
  | "missingFiles"
  | "uploading"
  | "pausedUP"
  | "queuedUP"
  | "stalledUP"
  | "checkingUP"
  | "forcedUP"
  | "allocating"
  | "downloading"
  | "metaDL"
  | "pausedDL"
  | "queuedDL"
  | "stalledDL"
  | "checkingDL"
  | "forcedDL"
  | "checkingResumeData"
  | "moving"
  | "unknown";

/**
 * Filter options for listing torrents
 */
export type TorrentFilter =
  | "all"
  | "downloading"
  | "seeding"
  | "completed"
  | "paused"
  | "active"
  | "inactive"
  | "resumed"
  | "stalled"
  | "stalled_uploading"
  | "stalled_downloading"
  | "errored";

/**
 * Connection status
 */
export type ConnectionStatus = "connected" | "firewalled" | "disconnected";

/**
 * Torrent information from /api/v2/torrents/info
 */
export interface Torrent {
  hash: string;
  name: string;
  size: number;
  progress: number;
  dlspeed: number;
  upspeed: number;
  eta: number;
  state: TorrentState;
  category: string;
  tags: string;
  save_path: string;
  added_on: number;
  completion_on: number;
  amount_left: number;
  downloaded: number;
  uploaded: number;
  ratio: number;
  num_seeds: number;
  num_leechs: number;
  num_complete: number;
  num_incomplete: number;
  priority: number;
  tracker: string;
  trackers_count: number;
  magnet_uri: string;
  content_path: string;
  total_size: number;
  infohash_v1: string;
  infohash_v2: string;
  last_activity: number;
  availability: number;
  auto_tmm: boolean;
  force_start: boolean;
  seq_dl: boolean;
  f_l_piece_prio: boolean;
  super_seeding: boolean;
  max_ratio: number;
  max_seeding_time: number;
  ratio_limit: number;
  seeding_time_limit: number;
  seen_complete: number;
  time_active: number;
  seeding_time: number;
  dl_limit: number;
  up_limit: number;
  downloaded_session: number;
  uploaded_session: number;
}

/**
 * Global transfer information from /api/v2/transfer/info
 */
export interface TransferInfo {
  dl_info_speed: number;
  dl_info_data: number;
  up_info_speed: number;
  up_info_data: number;
  dl_rate_limit: number;
  up_rate_limit: number;
  dht_nodes: number;
  connection_status: ConnectionStatus;
}

/**
 * Server state from /api/v2/sync/maindata
 */
export interface ServerState {
  free_space_on_disk: number;
  dl_info_speed: number;
  dl_info_data: number;
  up_info_speed: number;
  up_info_data: number;
  dl_rate_limit: number;
  up_rate_limit: number;
  dht_nodes: number;
  connection_status: ConnectionStatus;
  use_alt_speed_limits: boolean;
  alltime_dl: number;
  alltime_ul: number;
  average_time_queue: number;
  global_ratio: string;
  queued_io_jobs: number;
  queueing: boolean;
  read_cache_hits: string;
  read_cache_overload: string;
  refresh_interval: number;
  total_buffers_size: number;
  total_peer_connections: number;
  total_queued_size: number;
  total_wasted_session: number;
  write_cache_overload: string;
}

/**
 * Main data sync response from /api/v2/sync/maindata
 */
export interface SyncMainData {
  rid: number;
  full_update: boolean;
  torrents: Record<string, Partial<Torrent>>;
  torrents_removed: string[];
  categories: Record<string, { name: string; savePath: string }>;
  categories_removed: string[];
  tags: string[];
  tags_removed: string[];
  server_state: ServerState;
}

/**
 * Torrent properties from /api/v2/torrents/properties
 */
export interface TorrentProperties {
  save_path: string;
  creation_date: number;
  piece_size: number;
  comment: string;
  total_wasted: number;
  total_uploaded: number;
  total_uploaded_session: number;
  total_downloaded: number;
  total_downloaded_session: number;
  up_limit: number;
  dl_limit: number;
  time_elapsed: number;
  seeding_time: number;
  nb_connections: number;
  nb_connections_limit: number;
  share_ratio: number;
  addition_date: number;
  completion_date: number;
  created_by: string;
  dl_speed_avg: number;
  dl_speed: number;
  eta: number;
  last_seen: number;
  peers: number;
  peers_total: number;
  pieces_have: number;
  pieces_num: number;
  reannounce: number;
  seeds: number;
  seeds_total: number;
  total_size: number;
  up_speed: number;
  up_speed_avg: number;
}
