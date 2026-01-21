// Movie types
export interface RadarrImage {
  coverType: "poster" | "fanart" | "screenshot";
  url: string;
  remoteUrl?: string;
}

export interface RadarrRatings {
  imdb?: {
    votes: number;
    value: number;
    type: string;
  };
  tmdb?: {
    votes: number;
    value: number;
    type: string;
  };
}

export interface RadarrQuality {
  quality: {
    id: number;
    name: string;
    source?: string;
    resolution?: number;
    modifier?: string;
  };
  revision?: {
    version: number;
    real: number;
    isRepack: boolean;
  };
}

export interface RadarrMovieFile {
  id: number;
  movieId: number;
  relativePath: string;
  path: string;
  size: number;
  dateAdded: string;
  sceneName?: string;
  quality: RadarrQuality;
  mediaInfo?: {
    audioBitrate: number;
    audioChannels: number;
    audioCodec: string;
    audioLanguages: string;
    audioStreamCount: number;
    videoBitDepth: number;
    videoBitrate: number;
    videoCodec: string;
    videoFps: number;
    resolution: string;
    runTime: string;
    scanType: string;
    subtitles: string;
  };
  releaseGroup?: string;
}

export interface RadarrMovie {
  id?: number;
  title: string;
  originalTitle?: string;
  sortTitle: string;
  sizeOnDisk: number;
  status: "announced" | "inCinemas" | "released" | "deleted";
  overview: string;
  inCinemas?: string;
  physicalRelease?: string;
  digitalRelease?: string;
  images: RadarrImage[];
  remotePoster?: string;
  year: number;
  hasFile: boolean;
  youTubeTrailerId?: string;
  studio?: string;
  path?: string;
  qualityProfileId: number;
  monitored: boolean;
  minimumAvailability: "announced" | "inCinemas" | "released";
  isAvailable: boolean;
  folderName?: string;
  runtime: number;
  cleanTitle: string;
  imdbId?: string;
  tmdbId: number;
  titleSlug: string;
  rootFolderPath?: string;
  certification?: string;
  genres: string[];
  tags: number[];
  added?: string;
  ratings: RadarrRatings;
  movieFile?: RadarrMovieFile;
  popularity?: number;
}

// Queue types
export interface RadarrQueueItem {
  id: number;
  movieId: number;
  movie?: {
    id: number;
    title: string;
    year: number;
    tmdbId: number;
    imdbId?: string;
  };
  languages: Array<{
    id: number;
    name: string;
  }>;
  quality: RadarrQuality;
  customFormats: unknown[];
  customFormatScore: number;
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
  errorMessage?: string;
  downloadId?: string;
  protocol: "usenet" | "torrent";
  downloadClient?: string;
  indexer?: string;
  outputPath?: string;
}

export interface RadarrQueueResponse {
  page: number;
  pageSize: number;
  sortKey: string;
  sortDirection: "ascending" | "descending";
  totalRecords: number;
  records: RadarrQueueItem[];
}

// Calendar types - same as movie
export type RadarrCalendarMovie = RadarrMovie;

// Quality Profile types
export interface RadarrQualityProfile {
  id: number;
  name: string;
  upgradeAllowed: boolean;
  cutoff: number;
  items: Array<{
    id?: number;
    name?: string;
    quality?: {
      id: number;
      name: string;
      source: string;
      resolution: number;
      modifier: string;
    };
    items: unknown[];
    allowed: boolean;
  }>;
}

// Root Folder types
export interface RadarrRootFolder {
  id: number;
  path: string;
  accessible: boolean;
  freeSpace: number;
}

// Add Movie options
export interface RadarrAddMovieOptions {
  ignoreEpisodesWithFiles?: boolean;
  ignoreEpisodesWithoutFiles?: boolean;
  monitor: "movieOnly" | "movieAndCollection" | "none";
  searchForMovie?: boolean;
  addMethod?: string;
}

// Manual Import types
export interface RadarrManualImportItem {
  id: number;
  path: string;
  relativePath: string;
  folderName: string;
  name: string;
  size: number;
  movie?: RadarrMovie;
  quality: RadarrQuality;
  languages: Array<{ id: number; name: string }>;
  releaseGroup?: string;
  downloadId?: string;
  customFormats: unknown[];
  customFormatScore: number;
  rejections: Array<{ type: string; reason: string }>;
}

export interface RadarrManualImportRequest {
  id?: number;
  path: string;
  movieId: number;
  quality: RadarrQuality;
  languages: Array<{ id: number; name: string }>;
  releaseGroup?: string;
  downloadId?: string;
  indexerFlags?: number;
}

// History types
export interface RadarrHistoryRecord {
  id: number;
  movieId: number;
  movie?: RadarrMovie;
  sourceTitle: string;
  quality: RadarrQuality;
  qualityCutoffNotMet: boolean;
  languages: Array<{ id: number; name: string }>;
  date: string;
  downloadId?: string;
  eventType:
    | "grabbed"
    | "downloadFolderImported"
    | "downloadFailed"
    | "movieFileDeleted"
    | "movieFolderImported"
    | "movieFileRenamed"
    | "downloadIgnored";
  data: Record<string, unknown>;
}

export interface RadarrHistoryResponse {
  page: number;
  pageSize: number;
  sortKey: string;
  sortDirection: "ascending" | "descending";
  totalRecords: number;
  records: RadarrHistoryRecord[];
}

// Blocklist types
export interface RadarrBlocklistItem {
  id: number;
  movieId: number;
  movie?: RadarrMovie;
  sourceTitle: string;
  quality: RadarrQuality;
  languages: Array<{ id: number; name: string }>;
  date: string;
  protocol: "usenet" | "torrent";
  indexer?: string;
  message?: string;
}

export interface RadarrBlocklistResponse {
  page: number;
  pageSize: number;
  sortKey: string;
  sortDirection: "ascending" | "descending";
  totalRecords: number;
  records: RadarrBlocklistItem[];
}

// Command types
export interface RadarrCommand {
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

// System types
export interface RadarrSystemStatus {
  version: string;
  buildTime: string;
  isDebug: boolean;
  isProduction: boolean;
  isAdmin: boolean;
  isUserInteractive: boolean;
  startupPath: string;
  appData: string;
  osName: string;
  osVersion: string;
  isNetCore: boolean;
  isLinux: boolean;
  isOsx: boolean;
  isWindows: boolean;
  isDocker: boolean;
  mode: string;
  branch: string;
  authentication: string;
  sqliteVersion: string;
  urlBase: string;
  runtimeVersion: string;
  runtimeName: string;
  startTime: string;
  packageVersion: string;
  packageAuthor: string;
  packageUpdateMechanism: string;
}
