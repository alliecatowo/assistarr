// Series types
export interface SonarrImage {
  coverType: "poster" | "fanart" | "banner";
  url: string;
  remoteUrl?: string;
}

export interface SonarrSeason {
  seasonNumber: number;
  monitored: boolean;
  statistics?: {
    episodeFileCount: number;
    episodeCount: number;
    totalEpisodeCount: number;
    sizeOnDisk: number;
    percentOfEpisodes: number;
  };
}

export interface SonarrRatings {
  votes: number;
  value: number;
}

export interface SonarrStatistics {
  seasonCount: number;
  episodeFileCount: number;
  episodeCount: number;
  totalEpisodeCount: number;
  sizeOnDisk: number;
  percentOfEpisodes: number;
}

export interface SonarrSeries {
  id?: number;
  title: string;
  sortTitle: string;
  status: "continuing" | "ended" | "upcoming";
  ended: boolean;
  overview: string;
  network?: string;
  airTime?: string;
  images: SonarrImage[];
  remotePoster?: string;
  seasons: SonarrSeason[];
  year: number;
  path?: string;
  qualityProfileId: number;
  languageProfileId?: number;
  seasonFolder: boolean;
  monitored: boolean;
  useSceneNumbering: boolean;
  runtime: number;
  tvdbId: number;
  tvRageId?: number;
  tvMazeId?: number;
  firstAired?: string;
  seriesType: "standard" | "daily" | "anime";
  cleanTitle: string;
  imdbId?: string;
  titleSlug: string;
  rootFolderPath?: string;
  certification?: string;
  genres: string[];
  tags: number[];
  added?: string;
  ratings: SonarrRatings;
  statistics?: SonarrStatistics;
}

// Episode types
export interface SonarrQuality {
  quality: {
    id: number;
    name: string;
    source?: string;
    resolution?: number;
  };
  revision?: {
    version: number;
    real: number;
    isRepack: boolean;
  };
}

export interface SonarrEpisodeFile {
  id: number;
  seriesId: number;
  seasonNumber: number;
  relativePath: string;
  path: string;
  size: number;
  dateAdded: string;
  quality: SonarrQuality;
}

export interface SonarrEpisode {
  id: number;
  seriesId: number;
  tvdbId: number;
  episodeFileId: number;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  airDate: string;
  airDateUtc: string;
  overview?: string;
  hasFile: boolean;
  monitored: boolean;
  absoluteEpisodeNumber?: number;
  episodeFile?: SonarrEpisodeFile;
  series?: SonarrSeries;
}

// Queue types
export interface SonarrQueueItem {
  id: number;
  seriesId: number;
  episodeId: number;
  seasonNumber: number;
  series?: {
    id: number;
    title: string;
  };
  episode?: {
    id: number;
    seasonNumber: number;
    episodeNumber: number;
    title: string;
  };
  quality: SonarrQuality;
  size: number;
  title: string;
  sizeleft: number;
  timeleft?: string;
  estimatedCompletionTime?: string;
  status:
    | "downloading"
    | "paused"
    | "queued"
    | "completed"
    | "delay"
    | "downloadClientUnavailable"
    | "warning"
    | "failed";
  trackedDownloadStatus?: string;
  trackedDownloadState?: string;
  statusMessages: Array<{ title: string; messages: string[] }>;
  downloadId?: string;
  protocol: "usenet" | "torrent";
  downloadClient?: string;
  indexer?: string;
  outputPath?: string;
  errorMessage?: string; // Radarr calls this errorMessage, assuming Sonarr does too or similar
}

export interface SonarrQueueResponse {
  page: number;
  pageSize: number;
  sortKey: string;
  sortDirection: "ascending" | "descending";
  totalRecords: number;
  records: SonarrQueueItem[];
}

// Calendar types - same as episode but with series info
export interface SonarrCalendarEpisode extends SonarrEpisode {
  series?: SonarrSeries;
}

// Quality Profile types
export interface SonarrQualityProfile {
  id: number;
  name: string;
  upgradeAllowed: boolean;
  cutoff: number;
  items: Array<{
    id: number;
    quality?: {
      id: number;
      name: string;
      source: string;
      resolution: number;
    };
    items: unknown[];
    allowed: boolean;
  }>;
}

// Root Folder types
export interface SonarrRootFolder {
  id: number;
  path: string;
  accessible: boolean;
  freeSpace: number;
}

// Add Series options
export interface SonarrAddSeriesOptions {
  ignoreEpisodesWithFiles?: boolean;
  ignoreEpisodesWithoutFiles?: boolean;
  monitor:
    | "all"
    | "future"
    | "missing"
    | "existing"
    | "firstSeason"
    | "lastSeason"
    | "pilot"
    | "none";
  searchForMissingEpisodes?: boolean;
  searchForCutoffUnmetEpisodes?: boolean;
}

// Manual Import types
export interface SonarrManualImportItem {
  id: number;
  path: string;
  relativePath: string;
  folderName: string;
  name: string;
  size: number;
  series?: SonarrSeries;
  seasonNumber?: number;
  episodes?: SonarrEpisode[];
  quality: SonarrQuality;
  languages: Array<{ id: number; name: string }>;
  releaseGroup?: string;
  downloadId?: string;
  rejections: Array<{ type: string; reason: string }>;
}

export interface SonarrManualImportRequest {
  path: string;
  seriesId: number;
  seasonNumber: number;
  episodeIds: number[];
  quality: SonarrQuality;
  languages: Array<{ id: number; name: string }>;
  releaseGroup?: string;
  downloadId?: string;
  indexerFlags?: number;
}

// History types
export interface SonarrHistoryRecord {
  id: number;
  seriesId: number;
  episodeId: number;
  series?: SonarrSeries;
  episode?: SonarrEpisode;
  sourceTitle: string;
  quality: SonarrQuality;
  qualityCutoffNotMet: boolean;
  languages: Array<{ id: number; name: string }>;
  date: string;
  downloadId?: string;
  eventType:
    | "grabbed"
    | "downloadFolderImported"
    | "downloadFailed"
    | "episodeFileDeleted"
    | "episodeFileRenamed"
    | "downloadIgnored";
  data: Record<string, unknown>;
}

export interface SonarrHistoryResponse {
  page: number;
  pageSize: number;
  sortKey: string;
  sortDirection: "ascending" | "descending";
  totalRecords: number;
  records: SonarrHistoryRecord[];
}

// Blocklist types
export interface SonarrBlocklistItem {
  id: number;
  seriesId: number;
  episodeIds: number[];
  series?: SonarrSeries;
  sourceTitle: string;
  quality: SonarrQuality;
  languages: Array<{ id: number; name: string }>;
  date: string;
  protocol: "usenet" | "torrent";
  indexer?: string;
  message?: string;
}

export interface SonarrBlocklistResponse {
  page: number;
  pageSize: number;
  sortKey: string;
  sortDirection: "ascending" | "descending";
  totalRecords: number;
  records: SonarrBlocklistItem[];
}

// Command types
export interface SonarrCommand {
  id: number;
  name: string;
  commandName: string;
  message?: string;
  body: Record<string, unknown>;
  priority: string;
  status: "queued" | "started" | "completed" | "failed" | "aborted";
  result: string;
  queued: string;
  started?: string;
  ended?: string;
  trigger: string;
  stateChangeTime: string;
}
