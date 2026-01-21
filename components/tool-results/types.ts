/**
 * Shared types for tool result renderers
 *
 * This module uses SHAPE DETECTION (duck typing) instead of hardcoded tool names
 * to determine which renderer to use. This allows the system to work with any
 * plugin/service that returns data in a compatible shape.
 */

import type { ToolUIPart } from "ai";

export type ToolState = ToolUIPart["state"];

export interface ToolResultProps<T = unknown> {
  output: T;
  state: ToolState;
  input?: unknown;
}

// ============================================================================
// MEDIA ITEM SHAPES
// These interfaces define the expected shapes for media items from any source.
// Aligns with DisplayableMedia from lib/ai/tools/services/base.ts
// ============================================================================

/**
 * A media item with at minimum a title. This is the base shape for any
 * displayable media content. Matches the DisplayableMedia interface from base.ts.
 */
export interface MediaItemShape {
  title: string;
  year?: number;
  overview?: string;
  posterUrl?: string | null;
  rating?: number;
  // Standardized media type (from DisplayableMedia)
  mediaType?: "movie" | "tv" | "episode";
  // Standardized status (from DisplayableMedia)
  status?: "available" | "wanted" | "downloading" | "requested" | "missing" | string;
  // Service IDs nested under externalIds (from DisplayableMedia)
  externalIds?: {
    tmdb?: number;
    tvdb?: number;
    imdb?: string;
    jellyfin?: string;
  };
  // Legacy ID fields (backwards compatibility)
  id?: number | string;
  tmdbId?: number;
  tvdbId?: number;
  imdbId?: string;
  genres?: string[];
  runtime?: number;
  seasonCount?: number;
  // Legacy status fields (backwards compatibility)
  isAvailable?: boolean;
  isPending?: boolean;
  hasFile?: boolean;
  monitored?: boolean;
  // Jellyfin-specific field aliases (backwards compatibility)
  imageUrl?: string | null; // Alias for posterUrl in Jellyfin responses
  type?: string; // Jellyfin media type ("Movie", "Episode", "Series")
  seriesName?: string; // Jellyfin episode series name
}

/**
 * Output shape for tools that return a list of media results.
 * Works with search results, library lists, discovery, etc.
 */
export interface MediaResultsShape {
  results: MediaItemShape[];
  message?: string;
  // Pagination info (optional)
  page?: number;
  totalPages?: number;
  totalResults?: number;
  totalMatching?: number;
  totalInLibrary?: number;
  showing?: number;
}

// ============================================================================
// SHAPE DETECTION (DUCK TYPING)
// ============================================================================

/**
 * Type guard: Check if an item looks like a media item.
 * Now checks for DisplayableMedia shape (title + posterUrl + mediaType) first,
 * falls back to legacy detection (title only).
 */
export function isMediaItem(item: unknown): item is MediaItemShape {
  if (!item || typeof item !== "object") {
    return false;
  }
  const obj = item as Record<string, unknown>;

  // Must have title at minimum
  if (typeof obj.title !== "string" || obj.title.length === 0) {
    return false;
  }

  // If it has mediaType, it's likely a DisplayableMedia (stronger signal)
  if (obj.mediaType && ["movie", "tv", "episode"].includes(obj.mediaType as string)) {
    return true;
  }

  // If it has posterUrl (even null), it's likely media-related
  if ("posterUrl" in obj) {
    return true;
  }

  // Legacy detection: title + any other media field
  const hasMediaFields =
    "year" in obj ||
    "overview" in obj ||
    "rating" in obj ||
    "tmdbId" in obj ||
    "tvdbId" in obj ||
    "externalIds" in obj ||
    "status" in obj;

  return hasMediaFields;
}

/**
 * Type guard: Check if output looks like media results (array of media items)
 */
export function isMediaResultsShape(
  output: unknown
): output is MediaResultsShape {
  if (!output || typeof output !== "object") {
    return false;
  }
  const obj = output as Record<string, unknown>;

  // Check for 'results' array with media items
  if (Array.isArray(obj.results)) {
    // Empty results array is valid
    if (obj.results.length === 0) {
      return true;
    }
    // Check first item has title
    return isMediaItem(obj.results[0]);
  }

  return false;
}

// ============================================================================
// CALENDAR ITEM SHAPES
// ============================================================================

/**
 * Calendar item for movies (Radarr)
 */
export interface MovieCalendarItem {
  title: string;
  year?: number;
  tmdbId?: number;
  releaseDate: string;
  releaseType?: "digital" | "physical" | "cinema" | "unknown";
  hasFile?: boolean;
  monitored?: boolean;
  overview?: string;
  status?: string;
  runtime?: number;
  genres?: string[];
  posterUrl?: string;
}

/**
 * Calendar item for TV episodes (Sonarr)
 */
export interface EpisodeCalendarItem {
  seriesTitle: string;
  episodeTitle: string;
  seasonNumber: number;
  episodeNumber: number;
  airDate: string;
  airDateUtc: string;
  network?: string;
  hasFile?: boolean;
  monitored?: boolean;
  overview?: string;
  status?: string;
  posterUrl?: string;
}

/**
 * Output shape for movie calendar
 */
export interface MovieCalendarShape {
  movies: MovieCalendarItem[];
  message?: string;
}

/**
 * Output shape for episode calendar
 */
export interface EpisodeCalendarShape {
  episodes: EpisodeCalendarItem[];
  message?: string;
}

/**
 * Type guard: Check if output is movie calendar
 */
export function isMovieCalendarShape(
  output: unknown
): output is MovieCalendarShape {
  if (!output || typeof output !== "object") {
    return false;
  }
  const obj = output as Record<string, unknown>;
  if (!Array.isArray(obj.movies)) {
    return false;
  }
  if (obj.movies.length === 0) {
    return true;
  }
  const first = obj.movies[0] as Record<string, unknown>;
  return typeof first.title === "string" && "releaseDate" in first;
}

/**
 * Type guard: Check if output is episode calendar
 */
export function isEpisodeCalendarShape(
  output: unknown
): output is EpisodeCalendarShape {
  if (!output || typeof output !== "object") {
    return false;
  }
  const obj = output as Record<string, unknown>;
  if (!Array.isArray(obj.episodes)) {
    return false;
  }
  if (obj.episodes.length === 0) {
    return true;
  }
  const first = obj.episodes[0] as Record<string, unknown>;
  return typeof first.seriesTitle === "string" && "airDate" in first;
}

/**
 * Type guard: Check if output is any calendar shape
 */
export function isCalendarShape(
  output: unknown
): output is MovieCalendarShape | EpisodeCalendarShape {
  return isMovieCalendarShape(output) || isEpisodeCalendarShape(output);
}

// ============================================================================
// QUEUE ITEM SHAPES
// ============================================================================

/**
 * Queue item for Radarr/Sonarr downloads
 */
export interface ArrQueueItem {
  id: number;
  movieTitle?: string;
  movieYear?: number;
  seriesTitle?: string;
  episodeTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  quality: string;
  status: string;
  progress: string;
  size: string;
  sizeRemaining: string;
  timeLeft: string;
  downloadClient?: string;
  protocol?: string;
  errorMessage?: string;
}

/**
 * Torrent item for qBittorrent
 */
export interface TorrentItem {
  hash: string;
  name: string;
  state: string;
  rawState: string;
  progress: string;
  progressValue: number;
  size: string;
  downloaded: string;
  uploaded: string;
  downloadSpeed: string;
  uploadSpeed: string;
  eta: string;
  ratio: string;
  seeds: number;
  peers: number;
  category?: string | null;
  addedOn: string;
}

/**
 * Output shape for Radarr/Sonarr queue
 */
export interface ArrQueueShape {
  items: ArrQueueItem[];
  totalRecords: number;
  message?: string;
}

/**
 * Output shape for qBittorrent torrents
 */
export interface TorrentQueueShape {
  torrents: TorrentItem[];
  summary?: {
    total: number;
    downloading: number;
    seeding: number;
    paused: number;
  };
  message?: string;
}

/**
 * Type guard: Check if output is Radarr/Sonarr queue
 */
export function isArrQueueShape(output: unknown): output is ArrQueueShape {
  if (!output || typeof output !== "object") {
    return false;
  }
  const obj = output as Record<string, unknown>;
  if (!Array.isArray(obj.items)) {
    return false;
  }
  if (obj.items.length === 0) {
    return "totalRecords" in obj;
  }
  const first = obj.items[0] as Record<string, unknown>;
  return (
    "status" in first &&
    "progress" in first &&
    ("movieTitle" in first || "seriesTitle" in first)
  );
}

/**
 * Type guard: Check if output is qBittorrent torrents
 */
export function isTorrentQueueShape(
  output: unknown
): output is TorrentQueueShape {
  if (!output || typeof output !== "object") {
    return false;
  }
  const obj = output as Record<string, unknown>;
  if (!Array.isArray(obj.torrents)) {
    return false;
  }
  if (obj.torrents.length === 0) {
    return true;
  }
  const first = obj.torrents[0] as Record<string, unknown>;
  return "hash" in first && "name" in first && "state" in first;
}

/**
 * Type guard: Check if output is any queue shape
 */
export function isQueueShape(
  output: unknown
): output is ArrQueueShape | TorrentQueueShape {
  return isArrQueueShape(output) || isTorrentQueueShape(output);
}

// ============================================================================
// DISCOVERY SHAPES
// ============================================================================

/**
 * Discovery section (trending, popular, etc.)
 */
export interface DiscoverySection {
  title: string;
  items: MediaItemShape[];
}

/**
 * Output shape for discovery results
 */
export interface DiscoveryShape {
  sections: DiscoverySection[];
  message?: string;
}

/**
 * Type guard: Check if output is discovery shape
 */
export function isDiscoveryShape(output: unknown): output is DiscoveryShape {
  if (!output || typeof output !== "object") {
    return false;
  }
  const obj = output as Record<string, unknown>;
  if (!Array.isArray(obj.sections)) {
    return false;
  }
  if (obj.sections.length === 0) {
    return true;
  }
  const first = obj.sections[0] as Record<string, unknown>;
  return typeof first.title === "string" && Array.isArray(first.items);
}

// ============================================================================
// SUCCESS CONFIRMATION SHAPES
// ============================================================================

/**
 * Output shape for successful media requests (Jellyseerr, Radarr add, Sonarr add)
 */
export interface SuccessConfirmationShape {
  success: true;
  title: string;
  message?: string;
  // Media identification
  tmdbId?: number;
  tvdbId?: number;
  mediaType?: "movie" | "tv";
  // Request details
  requestId?: number;
  status?: string;
  is4k?: boolean;
  // Optional poster for rich display
  posterUrl?: string;
  year?: number;
}

/**
 * Type guard: Check if output is a success confirmation
 */
export function isSuccessConfirmationShape(
  output: unknown
): output is SuccessConfirmationShape {
  if (!output || typeof output !== "object") {
    return false;
  }
  const obj = output as Record<string, unknown>;

  // Must have success: true and a title
  if (obj.success !== true || typeof obj.title !== "string") {
    return false;
  }

  // Should have either tmdbId, tvdbId, or requestId to be a media confirmation
  return "tmdbId" in obj || "tvdbId" in obj || "requestId" in obj;
}

// ============================================================================
// RESULT TYPE DETECTION
// ============================================================================

/**
 * Detect the result type from output shape.
 * Returns the renderer type to use, or null for generic/JSON renderer.
 */
export type ResultType =
  | "media-results"
  | "queue"
  | "calendar"
  | "discovery"
  | "success"
  | null;

export function detectResultType(output: unknown): ResultType {
  // Check success confirmation first (most specific)
  if (isSuccessConfirmationShape(output)) {
    return "success";
  }
  // Check calendar first (more specific shape)
  if (isCalendarShape(output)) {
    return "calendar";
  }

  // Check queue
  if (isQueueShape(output)) {
    return "queue";
  }

  // Check discovery
  if (isDiscoveryShape(output)) {
    return "discovery";
  }

  // Check media results (most general shape)
  if (isMediaResultsShape(output)) {
    return "media-results";
  }

  return null;
}

// ============================================================================
// NORMALIZED TYPES
// ============================================================================

// Common media item interface normalized across all services
export interface NormalizedMediaItem {
  id: number;
  title: string;
  year?: number;
  overview?: string;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  rating?: number;
  mediaType: "movie" | "tv";
  status?: "available" | "requested" | "pending" | "unavailable";
  // Source-specific IDs
  tmdbId?: number;
  tvdbId?: number;
  imdbId?: string;
  // Radarr/Sonarr specific
  monitored?: boolean;
  hasFile?: boolean;
  qualityProfileId?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * @deprecated Tools should return full poster URLs. These constants are kept
 * for backwards compatibility with legacy code that receives TMDB relative paths.
 * New tools should use the service's poster URL directly (Radarr/Sonarr/Jellyseerr
 * all provide full URLs via remotePoster or getPosterUrl helper).
 */
export const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p";
/** @deprecated Use full URLs from service instead */
export const TMDB_POSTER_W185 = `${TMDB_POSTER_BASE}/w185`;
/** @deprecated Use full URLs from service instead */
export const TMDB_POSTER_W342 = `${TMDB_POSTER_BASE}/w342`;
/** @deprecated Use full URLs from service instead */
export const TMDB_POSTER_W500 = `${TMDB_POSTER_BASE}/w500`;
/** @deprecated Use full URLs from service instead */
export const TMDB_BACKDROP_W780 = `${TMDB_POSTER_BASE}/w780`;
