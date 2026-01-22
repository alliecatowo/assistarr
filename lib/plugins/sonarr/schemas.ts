/**
 * Zod schemas for Sonarr API response validation.
 *
 * These schemas validate external API responses to prevent trusting untrusted data.
 * They match the TypeScript interfaces in types.ts but provide runtime validation.
 *
 * Usage:
 *   const series = await client.get("/series/lookup", { term: query }, SonarrSeriesArraySchema);
 */

import { z } from "zod";
import {
  ArrQualitySchema,
  LanguageSchema,
  PaginatedResponseSchema,
  StatusMessageSchema,
} from "../core/schemas";

// ============================================================================
// IMAGE & RATINGS SCHEMAS
// ============================================================================

export const SonarrImageSchema = z
  .object({
    coverType: z.enum(["poster", "fanart", "banner"]),
    url: z.string(),
    remoteUrl: z.string().optional(),
  })
  .passthrough();

export type SonarrImage = z.infer<typeof SonarrImageSchema>;

export const SonarrRatingsSchema = z
  .object({
    votes: z.number(),
    value: z.number(),
  })
  .passthrough();

export type SonarrRatings = z.infer<typeof SonarrRatingsSchema>;

// ============================================================================
// SEASON & STATISTICS SCHEMAS
// ============================================================================

export const SonarrSeasonStatisticsSchema = z
  .object({
    episodeFileCount: z.number(),
    episodeCount: z.number(),
    totalEpisodeCount: z.number(),
    sizeOnDisk: z.number(),
    percentOfEpisodes: z.number(),
  })
  .passthrough();

export const SonarrSeasonSchema = z
  .object({
    seasonNumber: z.number(),
    monitored: z.boolean(),
    statistics: SonarrSeasonStatisticsSchema.optional(),
  })
  .passthrough();

export type SonarrSeason = z.infer<typeof SonarrSeasonSchema>;

export const SonarrStatisticsSchema = z
  .object({
    seasonCount: z.number(),
    episodeFileCount: z.number(),
    episodeCount: z.number(),
    totalEpisodeCount: z.number(),
    sizeOnDisk: z.number(),
    percentOfEpisodes: z.number(),
  })
  .passthrough();

export type SonarrStatistics = z.infer<typeof SonarrStatisticsSchema>;

// ============================================================================
// SERIES SCHEMA - Primary entity for Sonarr
// ============================================================================

export const SonarrSeriesSchema = z
  .object({
    id: z.number().optional(),
    title: z.string(),
    sortTitle: z.string(),
    status: z.enum(["continuing", "ended", "upcoming"]),
    ended: z.boolean(),
    overview: z.string(),
    network: z.string().optional(),
    airTime: z.string().optional(),
    images: z.array(SonarrImageSchema),
    remotePoster: z.string().optional(),
    seasons: z.array(SonarrSeasonSchema),
    year: z.number(),
    path: z.string().optional(),
    qualityProfileId: z.number(),
    languageProfileId: z.number().optional(),
    seasonFolder: z.boolean(),
    monitored: z.boolean(),
    useSceneNumbering: z.boolean(),
    runtime: z.number(),
    tvdbId: z.number(),
    tvRageId: z.number().optional(),
    tvMazeId: z.number().optional(),
    firstAired: z.string().optional(),
    seriesType: z.enum(["standard", "daily", "anime"]),
    cleanTitle: z.string(),
    imdbId: z.string().optional(),
    titleSlug: z.string(),
    rootFolderPath: z.string().optional(),
    certification: z.string().optional(),
    genres: z.array(z.string()),
    tags: z.array(z.number()),
    added: z.string().optional(),
    ratings: SonarrRatingsSchema,
    statistics: SonarrStatisticsSchema.optional(),
  })
  .passthrough();

export type SonarrSeries = z.infer<typeof SonarrSeriesSchema>;

export const SonarrSeriesArraySchema = z.array(SonarrSeriesSchema);

// ============================================================================
// EPISODE SCHEMAS
// ============================================================================

export const SonarrEpisodeFileSchema = z
  .object({
    id: z.number(),
    seriesId: z.number(),
    seasonNumber: z.number(),
    relativePath: z.string(),
    path: z.string(),
    size: z.number(),
    dateAdded: z.string(),
    quality: ArrQualitySchema,
  })
  .passthrough();

export type SonarrEpisodeFile = z.infer<typeof SonarrEpisodeFileSchema>;

export const SonarrEpisodeSchema = z
  .object({
    id: z.number(),
    seriesId: z.number(),
    tvdbId: z.number(),
    episodeFileId: z.number(),
    seasonNumber: z.number(),
    episodeNumber: z.number(),
    title: z.string(),
    airDate: z.string(),
    airDateUtc: z.string(),
    overview: z.string().optional(),
    hasFile: z.boolean(),
    monitored: z.boolean(),
    absoluteEpisodeNumber: z.number().optional(),
    episodeFile: SonarrEpisodeFileSchema.optional(),
    series: SonarrSeriesSchema.optional(),
  })
  .passthrough();

export type SonarrEpisode = z.infer<typeof SonarrEpisodeSchema>;

export const SonarrEpisodeArraySchema = z.array(SonarrEpisodeSchema);

// ============================================================================
// CALENDAR EPISODE (Episode with series info)
// ============================================================================

export const SonarrCalendarEpisodeSchema = SonarrEpisodeSchema.extend({
  series: SonarrSeriesSchema.optional(),
}).passthrough();

export type SonarrCalendarEpisode = z.infer<typeof SonarrCalendarEpisodeSchema>;

export const SonarrCalendarEpisodeArraySchema = z.array(
  SonarrCalendarEpisodeSchema
);

// ============================================================================
// QUEUE SCHEMAS
// ============================================================================

export const SonarrQueueItemSchema = z
  .object({
    id: z.number(),
    seriesId: z.number(),
    episodeId: z.number(),
    seasonNumber: z.number(),
    series: z
      .object({
        id: z.number(),
        title: z.string(),
      })
      .passthrough()
      .optional(),
    episode: z
      .object({
        id: z.number(),
        seasonNumber: z.number(),
        episodeNumber: z.number(),
        title: z.string(),
      })
      .passthrough()
      .optional(),
    quality: ArrQualitySchema,
    size: z.number(),
    title: z.string(),
    sizeleft: z.number(),
    timeleft: z.string().optional(),
    estimatedCompletionTime: z.string().optional(),
    status: z.enum([
      "downloading",
      "paused",
      "queued",
      "completed",
      "delay",
      "downloadClientUnavailable",
      "warning",
      "failed",
    ]),
    trackedDownloadStatus: z.string().optional(),
    trackedDownloadState: z.string().optional(),
    statusMessages: z.array(StatusMessageSchema),
    downloadId: z.string().optional(),
    protocol: z.enum(["usenet", "torrent"]),
    downloadClient: z.string().optional(),
    indexer: z.string().optional(),
    outputPath: z.string().optional(),
    errorMessage: z.string().optional(),
  })
  .passthrough();

export type SonarrQueueItem = z.infer<typeof SonarrQueueItemSchema>;

export const SonarrQueueResponseSchema = PaginatedResponseSchema(
  SonarrQueueItemSchema
);

export type SonarrQueueResponse = z.infer<typeof SonarrQueueResponseSchema>;

// ============================================================================
// QUALITY PROFILE SCHEMA
// ============================================================================

export const SonarrQualityProfileSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    upgradeAllowed: z.boolean(),
    cutoff: z.number(),
    items: z.array(
      z
        .object({
          id: z.number(),
          quality: z
            .object({
              id: z.number(),
              name: z.string(),
              source: z.string(),
              resolution: z.number(),
            })
            .passthrough()
            .optional(),
          items: z.array(z.unknown()),
          allowed: z.boolean(),
        })
        .passthrough()
    ),
  })
  .passthrough();

export type SonarrQualityProfile = z.infer<typeof SonarrQualityProfileSchema>;

export const SonarrQualityProfileArraySchema = z.array(
  SonarrQualityProfileSchema
);

// ============================================================================
// ROOT FOLDER SCHEMA
// ============================================================================

export const SonarrRootFolderSchema = z
  .object({
    id: z.number(),
    path: z.string(),
    accessible: z.boolean(),
    freeSpace: z.number(),
  })
  .passthrough();

export type SonarrRootFolder = z.infer<typeof SonarrRootFolderSchema>;

export const SonarrRootFolderArraySchema = z.array(SonarrRootFolderSchema);

// ============================================================================
// HISTORY SCHEMAS
// ============================================================================

export const SonarrHistoryRecordSchema = z
  .object({
    id: z.number(),
    seriesId: z.number(),
    episodeId: z.number(),
    series: SonarrSeriesSchema.optional(),
    episode: SonarrEpisodeSchema.optional(),
    sourceTitle: z.string(),
    quality: ArrQualitySchema,
    qualityCutoffNotMet: z.boolean(),
    languages: z.array(LanguageSchema),
    date: z.string(),
    downloadId: z.string().optional(),
    eventType: z.enum([
      "grabbed",
      "downloadFolderImported",
      "downloadFailed",
      "episodeFileDeleted",
      "episodeFileRenamed",
      "downloadIgnored",
    ]),
    data: z.record(z.unknown()),
  })
  .passthrough();

export type SonarrHistoryRecord = z.infer<typeof SonarrHistoryRecordSchema>;

export const SonarrHistoryResponseSchema = PaginatedResponseSchema(
  SonarrHistoryRecordSchema
);

export type SonarrHistoryResponse = z.infer<typeof SonarrHistoryResponseSchema>;

// ============================================================================
// BLOCKLIST SCHEMAS
// ============================================================================

export const SonarrBlocklistItemSchema = z
  .object({
    id: z.number(),
    seriesId: z.number(),
    episodeIds: z.array(z.number()),
    series: SonarrSeriesSchema.optional(),
    sourceTitle: z.string(),
    quality: ArrQualitySchema,
    languages: z.array(LanguageSchema),
    date: z.string(),
    protocol: z.enum(["usenet", "torrent"]),
    indexer: z.string().optional(),
    message: z.string().optional(),
  })
  .passthrough();

export type SonarrBlocklistItem = z.infer<typeof SonarrBlocklistItemSchema>;

export const SonarrBlocklistResponseSchema = PaginatedResponseSchema(
  SonarrBlocklistItemSchema
);

export type SonarrBlocklistResponse = z.infer<
  typeof SonarrBlocklistResponseSchema
>;

// ============================================================================
// COMMAND SCHEMA
// ============================================================================

export const SonarrCommandSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    commandName: z.string(),
    message: z.string().optional(),
    body: z.record(z.unknown()),
    priority: z.string(),
    status: z.enum(["queued", "started", "completed", "failed", "aborted"]),
    result: z.string(),
    queued: z.string(),
    started: z.string().optional(),
    ended: z.string().optional(),
    trigger: z.string(),
    stateChangeTime: z.string(),
  })
  .passthrough();

export type SonarrCommand = z.infer<typeof SonarrCommandSchema>;

export const SonarrCommandArraySchema = z.array(SonarrCommandSchema);

// ============================================================================
// SYSTEM STATUS SCHEMA
// ============================================================================

export const SonarrSystemStatusSchema = z
  .object({
    version: z.string(),
    buildTime: z.string(),
    isDebug: z.boolean(),
    isProduction: z.boolean(),
    isAdmin: z.boolean(),
    isUserInteractive: z.boolean(),
    startupPath: z.string(),
    appData: z.string(),
    osName: z.string(),
    osVersion: z.string(),
    isNetCore: z.boolean(),
    isLinux: z.boolean(),
    isOsx: z.boolean(),
    isWindows: z.boolean(),
    isDocker: z.boolean(),
    mode: z.string(),
    branch: z.string(),
    authentication: z.string(),
    sqliteVersion: z.string(),
    urlBase: z.string(),
    runtimeVersion: z.string(),
    runtimeName: z.string(),
    startTime: z.string(),
    packageVersion: z.string(),
    packageAuthor: z.string(),
    packageUpdateMechanism: z.string(),
  })
  .passthrough();

export type SonarrSystemStatus = z.infer<typeof SonarrSystemStatusSchema>;
