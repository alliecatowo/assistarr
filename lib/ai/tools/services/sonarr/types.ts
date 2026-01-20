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
