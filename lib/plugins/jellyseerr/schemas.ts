/**
 * Zod schemas for Jellyseerr API response validation.
 *
 * These schemas validate external API responses to prevent trusting untrusted data.
 * They match the TypeScript interfaces in types.ts but provide runtime validation.
 *
 * Usage:
 *   const results = await client.get("/search", params, JellyseerrSearchResponseSchema);
 */

import { z } from "zod";

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export const JellyseerrMediaTypeSchema = z.enum(["movie", "tv"]);
export type JellyseerrMediaType = z.infer<typeof JellyseerrMediaTypeSchema>;

/**
 * Media status values from Jellyseerr
 */
export const MediaStatusValues = {
  UNKNOWN: 1,
  PENDING: 2,
  PROCESSING: 3,
  PARTIALLY_AVAILABLE: 4,
  AVAILABLE: 5,
} as const;

export const JellyseerrMediaStatusSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);
export type JellyseerrMediaStatus = z.infer<typeof JellyseerrMediaStatusSchema>;

/**
 * Request status values from Jellyseerr
 */
export const RequestStatusValues = {
  PENDING: 1,
  APPROVED: 2,
  DECLINED: 3,
} as const;

export const JellyseerrRequestStatusSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);
export type JellyseerrRequestStatus = z.infer<
  typeof JellyseerrRequestStatusSchema
>;

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

export const JellyseerrMediaRequestSchema = z
  .object({
    id: z.number(),
    status: JellyseerrRequestStatusSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
    type: JellyseerrMediaTypeSchema,
    is4k: z.boolean(),
    serverId: z.number().optional(),
    profileId: z.number().optional(),
    rootFolder: z.string().optional(),
    languageProfileId: z.number().optional(),
    tags: z.array(z.number()).optional(),
    seasons: z.array(z.number()).optional(),
    media: z
      .object({
        id: z.number(),
        tmdbId: z.number(),
        status: JellyseerrMediaStatusSchema,
      })
      .passthrough()
      .optional(),
    requestedBy: z
      .object({
        id: z.number(),
        email: z.string().optional(),
        displayName: z.string().optional(),
      })
      .passthrough()
      .optional(),
    modifiedBy: z
      .object({
        id: z.number(),
        displayName: z.string().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

export type JellyseerrMediaRequest = z.infer<
  typeof JellyseerrMediaRequestSchema
>;

// ============================================================================
// MEDIA INFO SCHEMA
// ============================================================================

export const JellyseerrMediaInfoSchema = z
  .object({
    id: z.number(),
    tmdbId: z.number(),
    tvdbId: z.number().nullable().optional(),
    status: JellyseerrMediaStatusSchema,
    requests: z.array(JellyseerrMediaRequestSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
    externalServiceId: z.number().optional(),
    externalServiceSlug: z.string().optional(),
  })
  .passthrough();

export type JellyseerrMediaInfo = z.infer<typeof JellyseerrMediaInfoSchema>;

// ============================================================================
// SEARCH RESULT SCHEMAS
// ============================================================================

const SearchResultBaseSchema = z
  .object({
    id: z.number(),
    mediaType: JellyseerrMediaTypeSchema,
    popularity: z.number(),
    posterPath: z.string().nullable().optional(),
    backdropPath: z.string().nullable().optional(),
    voteCount: z.number(),
    voteAverage: z.number(),
    genreIds: z.array(z.number()),
    overview: z.string().optional(),
    originalLanguage: z.string(),
    mediaInfo: JellyseerrMediaInfoSchema.nullable().optional(),
  })
  .passthrough();

export const JellyseerrMovieSearchResultSchema = SearchResultBaseSchema.extend({
  mediaType: z.literal("movie"),
  title: z.string(),
  originalTitle: z.string(),
  releaseDate: z.string().optional(),
  adult: z.boolean(),
  video: z.boolean(),
}).passthrough();

export type JellyseerrMovieSearchResult = z.infer<
  typeof JellyseerrMovieSearchResultSchema
>;

export const JellyseerrTvSearchResultSchema = SearchResultBaseSchema.extend({
  mediaType: z.literal("tv"),
  name: z.string(),
  originalName: z.string(),
  firstAirDate: z.string().optional(),
  originCountry: z.array(z.string()).optional(),
}).passthrough();

export type JellyseerrTvSearchResult = z.infer<
  typeof JellyseerrTvSearchResultSchema
>;

export const JellyseerrSearchResultSchema = z.discriminatedUnion("mediaType", [
  JellyseerrMovieSearchResultSchema,
  JellyseerrTvSearchResultSchema,
]);

export type JellyseerrSearchResult = z.infer<
  typeof JellyseerrSearchResultSchema
>;

// ============================================================================
// SEARCH RESPONSE SCHEMA
// ============================================================================

export const JellyseerrSearchResponseSchema = z
  .object({
    page: z.number(),
    totalPages: z.number(),
    totalResults: z.number(),
    results: z.array(JellyseerrSearchResultSchema),
  })
  .passthrough();

export type JellyseerrSearchResponse = z.infer<
  typeof JellyseerrSearchResponseSchema
>;

// ============================================================================
// GENRE SCHEMA
// ============================================================================

export const JellyseerrGenreSchema = z
  .object({
    id: z.number(),
    name: z.string(),
  })
  .passthrough();

export type JellyseerrGenre = z.infer<typeof JellyseerrGenreSchema>;

// ============================================================================
// MOVIE DETAILS SCHEMA
// ============================================================================

export const JellyseerrMovieDetailsSchema = z
  .object({
    id: z.number(),
    imdbId: z.string().optional(),
    adult: z.boolean(),
    backdropPath: z.string().nullable().optional(),
    posterPath: z.string().nullable().optional(),
    budget: z.number(),
    genres: z.array(JellyseerrGenreSchema),
    homepage: z.string().optional(),
    originalLanguage: z.string(),
    originalTitle: z.string(),
    overview: z.string().optional(),
    popularity: z.number(),
    releaseDate: z.string().optional(),
    revenue: z.number(),
    runtime: z.number().optional(),
    status: z.string(),
    tagline: z.string().optional(),
    title: z.string(),
    video: z.boolean(),
    voteAverage: z.number(),
    voteCount: z.number(),
    mediaInfo: JellyseerrMediaInfoSchema.nullable().optional(),
  })
  .passthrough();

export type JellyseerrMovieDetails = z.infer<
  typeof JellyseerrMovieDetailsSchema
>;

// ============================================================================
// TV DETAILS SCHEMAS
// ============================================================================

export const JellyseerrTvSeasonSchema = z
  .object({
    id: z.number(),
    airDate: z.string().optional(),
    episodeCount: z.number(),
    name: z.string(),
    overview: z.string().optional(),
    posterPath: z.string().nullable().optional(),
    seasonNumber: z.number(),
  })
  .passthrough();

export type JellyseerrTvSeason = z.infer<typeof JellyseerrTvSeasonSchema>;

export const JellyseerrTvDetailsSchema = z
  .object({
    id: z.number(),
    backdropPath: z.string().nullable().optional(),
    posterPath: z.string().nullable().optional(),
    createdBy: z
      .array(z.object({ id: z.number(), name: z.string() }).passthrough())
      .optional(),
    episodeRunTime: z.array(z.number()).optional(),
    firstAirDate: z.string().optional(),
    genres: z.array(JellyseerrGenreSchema),
    homepage: z.string().optional(),
    inProduction: z.boolean(),
    languages: z.array(z.string()).optional(),
    lastAirDate: z.string().optional(),
    name: z.string(),
    numberOfEpisodes: z.number(),
    numberOfSeasons: z.number(),
    originCountry: z.array(z.string()).optional(),
    originalLanguage: z.string(),
    originalName: z.string(),
    overview: z.string().optional(),
    popularity: z.number(),
    status: z.string(),
    tagline: z.string().optional(),
    type: z.string().optional(),
    voteAverage: z.number(),
    voteCount: z.number(),
    seasons: z.array(JellyseerrTvSeasonSchema),
    mediaInfo: JellyseerrMediaInfoSchema.nullable().optional(),
  })
  .passthrough();

export type JellyseerrTvDetails = z.infer<typeof JellyseerrTvDetailsSchema>;

// ============================================================================
// REQUESTS RESPONSE SCHEMA
// ============================================================================

export const JellyseerrRequestsResponseSchema = z
  .object({
    pageInfo: z
      .object({
        pages: z.number(),
        pageSize: z.number(),
        results: z.number(),
        page: z.number(),
      })
      .passthrough(),
    results: z.array(JellyseerrMediaRequestSchema),
  })
  .passthrough();

export type JellyseerrRequestsResponse = z.infer<
  typeof JellyseerrRequestsResponseSchema
>;

// ============================================================================
// USER SCHEMA
// ============================================================================

export const JellyseerrUserSchema = z
  .object({
    id: z.number(),
    email: z.string().optional(),
    plexUsername: z.string().nullable().optional(),
    jellyfinUsername: z.string().nullable().optional(),
    username: z.string().nullable().optional(),
    userType: z.number(),
    permissions: z.number(),
    avatar: z.string().optional(),
    movieQuotaLimit: z.number().nullable().optional(),
    movieQuotaDays: z.number().nullable().optional(),
    tvQuotaLimit: z.number().nullable().optional(),
    tvQuotaDays: z.number().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    requestCount: z.number(),
  })
  .passthrough();

export type JellyseerrUser = z.infer<typeof JellyseerrUserSchema>;

// ============================================================================
// ERROR SCHEMA
// ============================================================================

export const JellyseerrErrorSchema = z
  .object({
    message: z.string(),
    statusCode: z.number(),
  })
  .passthrough();

export type JellyseerrError = z.infer<typeof JellyseerrErrorSchema>;
