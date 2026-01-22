/**
 * Zod schemas for Radarr API response validation.
 *
 * These schemas validate external API responses to prevent trusting untrusted data.
 * They match the TypeScript interfaces in types.ts but provide runtime validation.
 *
 * Usage:
 *   const movies = await client.get("/movie/lookup", { term: query }, RadarrMovieArraySchema);
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

export const RadarrImageSchema = z
  .object({
    coverType: z.enum(["poster", "fanart", "screenshot"]),
    url: z.string(),
    remoteUrl: z.string().optional(),
  })
  .passthrough();

export type RadarrImage = z.infer<typeof RadarrImageSchema>;

export const RadarrRatingsSchema = z
  .object({
    imdb: z
      .object({
        votes: z.number(),
        value: z.number(),
        type: z.string(),
      })
      .passthrough()
      .optional(),
    tmdb: z
      .object({
        votes: z.number(),
        value: z.number(),
        type: z.string(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type RadarrRatings = z.infer<typeof RadarrRatingsSchema>;

// ============================================================================
// MOVIE FILE SCHEMA
// ============================================================================

export const RadarrMovieFileSchema = z
  .object({
    id: z.number(),
    movieId: z.number(),
    relativePath: z.string(),
    path: z.string(),
    size: z.number(),
    dateAdded: z.string(),
    sceneName: z.string().optional(),
    quality: ArrQualitySchema,
    mediaInfo: z
      .object({
        audioBitrate: z.number(),
        audioChannels: z.number(),
        audioCodec: z.string(),
        audioLanguages: z.string(),
        audioStreamCount: z.number(),
        videoBitDepth: z.number(),
        videoBitrate: z.number(),
        videoCodec: z.string(),
        videoFps: z.number(),
        resolution: z.string(),
        runTime: z.string(),
        scanType: z.string(),
        subtitles: z.string(),
      })
      .passthrough()
      .optional(),
    releaseGroup: z.string().optional(),
  })
  .passthrough();

export type RadarrMovieFile = z.infer<typeof RadarrMovieFileSchema>;

// ============================================================================
// MOVIE SCHEMA - Primary entity for Radarr
// ============================================================================

export const RadarrMovieSchema = z
  .object({
    id: z.number().optional(),
    title: z.string(),
    originalTitle: z.string().optional(),
    sortTitle: z.string(),
    sizeOnDisk: z.number(),
    status: z.enum(["announced", "inCinemas", "released", "deleted"]),
    overview: z.string(),
    inCinemas: z.string().optional(),
    physicalRelease: z.string().optional(),
    digitalRelease: z.string().optional(),
    images: z.array(RadarrImageSchema),
    remotePoster: z.string().optional(),
    year: z.number(),
    hasFile: z.boolean(),
    youTubeTrailerId: z.string().optional(),
    studio: z.string().optional(),
    path: z.string().optional(),
    qualityProfileId: z.number(),
    monitored: z.boolean(),
    minimumAvailability: z.enum(["announced", "inCinemas", "released"]),
    isAvailable: z.boolean(),
    folderName: z.string().optional(),
    runtime: z.number(),
    cleanTitle: z.string(),
    imdbId: z.string().optional(),
    tmdbId: z.number(),
    titleSlug: z.string(),
    rootFolderPath: z.string().optional(),
    certification: z.string().optional(),
    genres: z.array(z.string()),
    tags: z.array(z.number()),
    added: z.string().optional(),
    ratings: RadarrRatingsSchema,
    movieFile: RadarrMovieFileSchema.optional(),
    popularity: z.number().optional(),
  })
  .passthrough();

export type RadarrMovie = z.infer<typeof RadarrMovieSchema>;

/**
 * Schema for arrays of movies (search results, library)
 */
export const RadarrMovieArraySchema = z.array(RadarrMovieSchema);

// ============================================================================
// QUEUE SCHEMAS
// ============================================================================

export const RadarrQueueItemSchema = z
  .object({
    id: z.number(),
    movieId: z.number(),
    movie: z
      .object({
        id: z.number(),
        title: z.string(),
        year: z.number(),
        tmdbId: z.number(),
        imdbId: z.string().optional(),
      })
      .passthrough()
      .optional(),
    languages: z.array(LanguageSchema),
    quality: ArrQualitySchema,
    customFormats: z.array(z.unknown()),
    customFormatScore: z.number(),
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
    errorMessage: z.string().optional(),
    downloadId: z.string().optional(),
    protocol: z.enum(["usenet", "torrent"]),
    downloadClient: z.string().optional(),
    indexer: z.string().optional(),
    outputPath: z.string().optional(),
  })
  .passthrough();

export type RadarrQueueItem = z.infer<typeof RadarrQueueItemSchema>;

/**
 * Paginated queue response
 */
export const RadarrQueueResponseSchema = PaginatedResponseSchema(
  RadarrQueueItemSchema
);

export type RadarrQueueResponse = z.infer<typeof RadarrQueueResponseSchema>;

// ============================================================================
// QUALITY PROFILE SCHEMA
// ============================================================================

export const RadarrQualityProfileSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    upgradeAllowed: z.boolean(),
    cutoff: z.number(),
    items: z.array(
      z
        .object({
          id: z.number().optional(),
          name: z.string().optional(),
          quality: z
            .object({
              id: z.number(),
              name: z.string(),
              source: z.string(),
              resolution: z.number(),
              modifier: z.string(),
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

export type RadarrQualityProfile = z.infer<typeof RadarrQualityProfileSchema>;

export const RadarrQualityProfileArraySchema = z.array(
  RadarrQualityProfileSchema
);

// ============================================================================
// ROOT FOLDER SCHEMA
// ============================================================================

export const RadarrRootFolderSchema = z
  .object({
    id: z.number(),
    path: z.string(),
    accessible: z.boolean(),
    freeSpace: z.number(),
  })
  .passthrough();

export type RadarrRootFolder = z.infer<typeof RadarrRootFolderSchema>;

export const RadarrRootFolderArraySchema = z.array(RadarrRootFolderSchema);

// ============================================================================
// HISTORY SCHEMAS
// ============================================================================

export const RadarrHistoryRecordSchema = z
  .object({
    id: z.number(),
    movieId: z.number(),
    movie: RadarrMovieSchema.optional(),
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
      "movieFileDeleted",
      "movieFolderImported",
      "movieFileRenamed",
      "downloadIgnored",
    ]),
    data: z.record(z.unknown()),
  })
  .passthrough();

export type RadarrHistoryRecord = z.infer<typeof RadarrHistoryRecordSchema>;

export const RadarrHistoryResponseSchema = PaginatedResponseSchema(
  RadarrHistoryRecordSchema
);

export type RadarrHistoryResponse = z.infer<typeof RadarrHistoryResponseSchema>;

// ============================================================================
// BLOCKLIST SCHEMAS
// ============================================================================

export const RadarrBlocklistItemSchema = z
  .object({
    id: z.number(),
    movieId: z.number(),
    movie: RadarrMovieSchema.optional(),
    sourceTitle: z.string(),
    quality: ArrQualitySchema,
    languages: z.array(LanguageSchema),
    date: z.string(),
    protocol: z.enum(["usenet", "torrent"]),
    indexer: z.string().optional(),
    message: z.string().optional(),
  })
  .passthrough();

export type RadarrBlocklistItem = z.infer<typeof RadarrBlocklistItemSchema>;

export const RadarrBlocklistResponseSchema = PaginatedResponseSchema(
  RadarrBlocklistItemSchema
);

export type RadarrBlocklistResponse = z.infer<
  typeof RadarrBlocklistResponseSchema
>;

// ============================================================================
// COMMAND SCHEMA
// ============================================================================

export const RadarrCommandSchema = z
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

export type RadarrCommand = z.infer<typeof RadarrCommandSchema>;

export const RadarrCommandArraySchema = z.array(RadarrCommandSchema);

// ============================================================================
// SYSTEM STATUS SCHEMA
// ============================================================================

export const RadarrSystemStatusSchema = z
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

export type RadarrSystemStatus = z.infer<typeof RadarrSystemStatusSchema>;
