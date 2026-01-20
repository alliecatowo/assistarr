/**
 * TypeScript types for Jellyseerr API responses
 */

export type MediaType = "movie" | "tv";

/**
 * Media status values from Jellyseerr
 */
export enum MediaStatus {
  UNKNOWN = 1,
  PENDING = 2,
  PROCESSING = 3,
  PARTIALLY_AVAILABLE = 4,
  AVAILABLE = 5,
}

/**
 * Request status values from Jellyseerr
 */
export enum RequestStatus {
  PENDING = 1,
  APPROVED = 2,
  DECLINED = 3,
}

export interface MediaInfo {
  id: number;
  tmdbId: number;
  tvdbId?: number | null;
  status: MediaStatus;
  requests: MediaRequest[];
  createdAt: string;
  updatedAt: string;
  externalServiceId?: number;
  externalServiceSlug?: string;
}

export interface MediaRequest {
  id: number;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  type: MediaType;
  is4k: boolean;
  serverId?: number;
  profileId?: number;
  rootFolder?: string;
  languageProfileId?: number;
  tags?: number[];
  seasons?: number[];
  media?: {
    id: number;
    tmdbId: number;
    status: MediaStatus;
  };
  requestedBy?: {
    id: number;
    email?: string;
    displayName?: string;
  };
  modifiedBy?: {
    id: number;
    displayName?: string;
  } | null;
}

export interface SearchResultBase {
  id: number;
  mediaType: MediaType;
  popularity: number;
  posterPath?: string | null;
  backdropPath?: string | null;
  voteCount: number;
  voteAverage: number;
  genreIds: number[];
  overview?: string;
  originalLanguage: string;
  mediaInfo?: MediaInfo | null;
}

export interface MovieSearchResult extends SearchResultBase {
  mediaType: "movie";
  title: string;
  originalTitle: string;
  releaseDate?: string;
  adult: boolean;
  video: boolean;
}

export interface TvSearchResult extends SearchResultBase {
  mediaType: "tv";
  name: string;
  originalName: string;
  firstAirDate?: string;
  originCountry?: string[];
}

export type SearchResult = MovieSearchResult | TvSearchResult;

export interface SearchResponse {
  page: number;
  totalPages: number;
  totalResults: number;
  results: SearchResult[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface MovieDetails {
  id: number;
  imdbId?: string;
  adult: boolean;
  backdropPath?: string | null;
  posterPath?: string | null;
  budget: number;
  genres: Genre[];
  homepage?: string;
  originalLanguage: string;
  originalTitle: string;
  overview?: string;
  popularity: number;
  releaseDate?: string;
  revenue: number;
  runtime?: number;
  status: string;
  tagline?: string;
  title: string;
  video: boolean;
  voteAverage: number;
  voteCount: number;
  mediaInfo?: MediaInfo | null;
}

export interface TvSeason {
  id: number;
  airDate?: string;
  episodeCount: number;
  name: string;
  overview?: string;
  posterPath?: string | null;
  seasonNumber: number;
}

export interface TvDetails {
  id: number;
  backdropPath?: string | null;
  posterPath?: string | null;
  createdBy?: { id: number; name: string }[];
  episodeRunTime?: number[];
  firstAirDate?: string;
  genres: Genre[];
  homepage?: string;
  inProduction: boolean;
  languages?: string[];
  lastAirDate?: string;
  name: string;
  numberOfEpisodes: number;
  numberOfSeasons: number;
  originCountry?: string[];
  originalLanguage: string;
  originalName: string;
  overview?: string;
  popularity: number;
  status: string;
  tagline?: string;
  type?: string;
  voteAverage: number;
  voteCount: number;
  seasons: TvSeason[];
  mediaInfo?: MediaInfo | null;
}

export interface RequestsResponse {
  pageInfo: {
    pages: number;
    pageSize: number;
    results: number;
    page: number;
  };
  results: MediaRequest[];
}

export interface CreateRequestBody {
  mediaType: MediaType;
  mediaId: number;
  is4k?: boolean;
  serverId?: number;
  profileId?: number;
  rootFolder?: string;
  languageProfileId?: number;
  tags?: number[];
  seasons?: number[] | "all";
}

export interface JellyseerrUser {
  id: number;
  email?: string;
  plexUsername?: string | null;
  jellyfinUsername?: string | null;
  username?: string | null;
  userType: number;
  permissions: number;
  avatar?: string;
  movieQuotaLimit?: number | null;
  movieQuotaDays?: number | null;
  tvQuotaLimit?: number | null;
  tvQuotaDays?: number | null;
  createdAt: string;
  updatedAt: string;
  requestCount: number;
}

export interface JellyseerrError {
  message: string;
  statusCode: number;
}

/**
 * Helper function to get human-readable status from MediaStatus enum
 */
export function getMediaStatusText(status: MediaStatus): string {
  switch (status) {
    case MediaStatus.UNKNOWN:
      return "Unknown";
    case MediaStatus.PENDING:
      return "Pending";
    case MediaStatus.PROCESSING:
      return "Processing";
    case MediaStatus.PARTIALLY_AVAILABLE:
      return "Partially Available";
    case MediaStatus.AVAILABLE:
      return "Available";
    default:
      return "Unknown";
  }
}

/**
 * Helper function to get human-readable status from RequestStatus enum
 */
export function getRequestStatusText(status: RequestStatus): string {
  switch (status) {
    case RequestStatus.PENDING:
      return "Pending Approval";
    case RequestStatus.APPROVED:
      return "Approved";
    case RequestStatus.DECLINED:
      return "Declined";
    default:
      return "Unknown";
  }
}

/**
 * Type guard to check if a search result is a movie
 */
export function isMovieResult(
  result: SearchResult
): result is MovieSearchResult {
  return result.mediaType === "movie";
}

/**
 * Type guard to check if a search result is a TV show
 */
export function isTvResult(result: SearchResult): result is TvSearchResult {
  return result.mediaType === "tv";
}

/**
 * Get the title from a search result regardless of type
 */
export function getResultTitle(result: SearchResult): string {
  return isMovieResult(result) ? result.title : result.name;
}

/**
 * Get the release/air date from a search result regardless of type
 */
export function getResultDate(result: SearchResult): string | undefined {
  return isMovieResult(result) ? result.releaseDate : result.firstAirDate;
}

/**
 * Get the year from a search result's date
 */
export function getResultYear(result: SearchResult): number | undefined {
  const date = getResultDate(result);
  if (!date) {
    return undefined;
  }
  const year = new Date(date).getFullYear();
  return Number.isNaN(year) ? undefined : year;
}
