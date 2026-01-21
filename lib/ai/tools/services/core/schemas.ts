import { z } from "zod";

/**
 * Shared Zod schemas for service tools.
 * Centralizes common validation patterns.
 */

/**
 * Schema for displayable media status
 */
export const mediaStatusSchema = z.enum([
  "available",
  "wanted",
  "downloading",
  "requested",
  "missing",
]);

/**
 * Schema for media type
 */
export const mediaTypeSchema = z.enum(["movie", "tv", "episode"]);

/**
 * Schema for external IDs (TMDB, TVDB, IMDB, Jellyfin)
 */
export const externalIdsSchema = z
  .object({
    tmdb: z.number().optional(),
    tvdb: z.number().optional(),
    imdb: z.string().optional(),
    jellyfin: z.string().optional(),
  })
  .optional();

/**
 * Core schema for displayable media items returned by search/lookup tools.
 * Matches the DisplayableMedia interface in base.ts.
 */
export const displayableMediaSchema = z.object({
  // Required display fields
  title: z.string(),
  posterUrl: z.string().nullable(),
  mediaType: mediaTypeSchema,

  // Rich metadata (all optional)
  year: z.number().optional(),
  overview: z.string().optional(),
  rating: z.number().optional(),
  genres: z.array(z.string()).optional(),
  runtime: z.number().optional(),
  seasonCount: z.number().optional(),

  // Status fields
  status: mediaStatusSchema.optional(),
  hasFile: z.boolean().optional(),
  monitored: z.boolean().optional(),

  // Service IDs
  serviceId: z.union([z.number(), z.string()]).optional(),
  externalIds: externalIdsSchema,
});

/**
 * Schema for quality profiles (used in Radarr/Sonarr)
 */
export const qualityProfileSchema = z.object({
  id: z.number(),
  name: z.string(),
});

/**
 * Schema for root folders (used in Radarr/Sonarr)
 */
export const rootFolderSchema = z.object({
  id: z.number(),
  path: z.string(),
  freeSpace: z.number().optional(),
});

/**
 * Common input schema for tools that require a movie/series ID
 */
export const serviceIdInputSchema = z.object({
  id: z.number().describe("The internal service ID of the item"),
});

/**
 * Common input schema for tools that use TMDB ID
 */
export const tmdbIdInputSchema = z.object({
  tmdbId: z.number().describe("The TMDB ID of the movie/series"),
});

/**
 * Common input schema for tools that use TVDB ID
 */
export const tvdbIdInputSchema = z.object({
  tvdbId: z.number().describe("The TVDB ID of the series"),
});

/**
 * Common input schema for search operations
 */
export const searchQueryInputSchema = z.object({
  query: z.string().describe("The search term"),
});

/**
 * Schema for add media requests
 */
export const addMediaRequestSchema = z.object({
  qualityProfileId: z.number().optional().describe("Quality profile ID"),
  rootFolderPath: z.string().optional().describe("Root folder path"),
  monitored: z
    .boolean()
    .optional()
    .default(true)
    .describe("Whether to monitor"),
  searchForMovie: z
    .boolean()
    .optional()
    .default(true)
    .describe("Whether to search for the movie after adding"),
  searchForMissingEpisodes: z
    .boolean()
    .optional()
    .default(true)
    .describe("Whether to search for missing episodes after adding"),
});

/**
 * Type exports derived from schemas
 */
export type MediaStatus = z.infer<typeof mediaStatusSchema>;
export type MediaType = z.infer<typeof mediaTypeSchema>;
export type ExternalIds = z.infer<typeof externalIdsSchema>;
export type DisplayableMediaSchema = z.infer<typeof displayableMediaSchema>;
export type QualityProfile = z.infer<typeof qualityProfileSchema>;
export type RootFolder = z.infer<typeof rootFolderSchema>;
