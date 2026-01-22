/**
 * Zod schemas for Jellyfin API response validation.
 *
 * These schemas validate external API responses to prevent trusting untrusted data.
 * They match the TypeScript interfaces in types.ts but provide runtime validation.
 *
 * Usage:
 *   const items = await client.get("/Items", params, JellyfinItemsResponseSchema);
 */

import { z } from "zod";

// ============================================================================
// MEDIA TYPE SCHEMA
// ============================================================================

export const JellyfinMediaTypeSchema = z.enum([
  "Movie",
  "Series",
  "Episode",
  "Season",
]);

export type JellyfinMediaType = z.infer<typeof JellyfinMediaTypeSchema>;

// ============================================================================
// SUPPORTING SCHEMAS
// ============================================================================

export const JellyfinImageTagsSchema = z
  .object({
    Primary: z.string().optional(),
    Backdrop: z.string().optional(),
    Logo: z.string().optional(),
    Thumb: z.string().optional(),
  })
  .passthrough();

export type JellyfinImageTags = z.infer<typeof JellyfinImageTagsSchema>;

export const JellyfinUserDataSchema = z
  .object({
    PlaybackPositionTicks: z.number(),
    PlayCount: z.number(),
    IsFavorite: z.boolean(),
    Played: z.boolean(),
    LastPlayedDate: z.string().optional(),
    PlayedPercentage: z.number().optional(),
    Key: z.string().optional(),
  })
  .passthrough();

export type JellyfinUserData = z.infer<typeof JellyfinUserDataSchema>;

export const JellyfinStudioSchema = z
  .object({
    Name: z.string(),
    Id: z.string().optional(),
  })
  .passthrough();

export type JellyfinStudio = z.infer<typeof JellyfinStudioSchema>;

export const JellyfinPersonSchema = z
  .object({
    Name: z.string(),
    Id: z.string(),
    Role: z.string().optional(),
    Type: z.enum(["Actor", "Director", "Writer", "Producer"]),
  })
  .passthrough();

export type JellyfinPerson = z.infer<typeof JellyfinPersonSchema>;

// ============================================================================
// MEDIA ITEM SCHEMA - Primary entity for Jellyfin
// ============================================================================

export const JellyfinMediaItemSchema = z
  .object({
    Id: z.string(),
    Name: z.string(),
    Type: JellyfinMediaTypeSchema,
    ServerId: z.string().optional(),
    ProductionYear: z.number().optional(),
    Overview: z.string().optional(),
    RunTimeTicks: z.number().optional(),
    CommunityRating: z.number().optional(),
    OfficialRating: z.string().optional(),
    Genres: z.array(z.string()).optional(),
    ImageTags: JellyfinImageTagsSchema.optional(),
    BackdropImageTags: z.array(z.string()).optional(),
    UserData: JellyfinUserDataSchema.optional(),
    DateCreated: z.string().optional(),
    PremiereDate: z.string().optional(),
    Studios: z.array(JellyfinStudioSchema).optional(),
    People: z.array(JellyfinPersonSchema).optional(),
    IsFolder: z.boolean().optional(),
    // Episode-specific fields
    SeriesName: z.string().optional(),
    SeriesId: z.string().optional(),
    SeasonId: z.string().optional(),
    IndexNumber: z.number().optional(),
    ParentIndexNumber: z.number().optional(),
  })
  .passthrough();

export type JellyfinMediaItem = z.infer<typeof JellyfinMediaItemSchema>;

// ============================================================================
// SEARCH HINT SCHEMA
// ============================================================================

export const JellyfinSearchHintSchema = z
  .object({
    ItemId: z.string(),
    Id: z.string(),
    Name: z.string(),
    ProductionYear: z.number().optional(),
    Type: z.string(),
    PrimaryImageTag: z.string().optional(),
    RunTimeTicks: z.number().optional(),
    MediaType: z.string().optional(),
  })
  .passthrough();

export type JellyfinSearchHint = z.infer<typeof JellyfinSearchHintSchema>;

// ============================================================================
// LIBRARY SCHEMA
// ============================================================================

export const JellyfinLibrarySchema = z
  .object({
    Id: z.string(),
    Name: z.string(),
    ServerId: z.string().optional(),
    CollectionType: z.enum(["movies", "tvshows", "music", "photos"]).optional(),
    Type: z.string(),
    ImageTags: JellyfinImageTagsSchema.optional(),
  })
  .passthrough();

export type JellyfinLibrary = z.infer<typeof JellyfinLibrarySchema>;

// ============================================================================
// RESPONSE SCHEMAS
// ============================================================================

export const JellyfinItemsResponseSchema = z
  .object({
    Items: z.array(JellyfinMediaItemSchema),
    TotalRecordCount: z.number(),
  })
  .passthrough();

export type JellyfinItemsResponse = z.infer<typeof JellyfinItemsResponseSchema>;

export const JellyfinSearchResponseSchema = z
  .object({
    SearchHints: z.array(JellyfinSearchHintSchema),
    TotalRecordCount: z.number(),
  })
  .passthrough();

export type JellyfinSearchResponse = z.infer<
  typeof JellyfinSearchResponseSchema
>;

export const JellyfinLibrariesResponseSchema = z
  .object({
    Items: z.array(JellyfinLibrarySchema),
    TotalRecordCount: z.number(),
  })
  .passthrough();

export type JellyfinLibrariesResponse = z.infer<
  typeof JellyfinLibrariesResponseSchema
>;

// ============================================================================
// ERROR SCHEMA
// ============================================================================

export const JellyfinErrorSchema = z
  .object({
    message: z.string().optional(),
    statusCode: z.number().optional(),
  })
  .passthrough();

export type JellyfinError = z.infer<typeof JellyfinErrorSchema>;
