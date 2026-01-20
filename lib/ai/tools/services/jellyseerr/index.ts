export { searchContent } from "./search-content";
export { requestMedia } from "./request-media";
export { getRequests } from "./get-requests";

// Re-export types for convenience
export type {
  MediaType,
  SearchResult,
  MovieSearchResult,
  TvSearchResult,
  SearchResponse,
  MediaRequest,
  MediaInfo,
  MovieDetails,
  TvDetails,
  RequestsResponse,
  JellyseerrUser,
} from "./types";

export {
  MediaStatus,
  RequestStatus,
  getMediaStatusText,
  getRequestStatusText,
  isMovieResult,
  isTvResult,
  getResultTitle,
  getResultDate,
  getResultYear,
} from "./types";

// Re-export client utilities
export {
  JellyseerrClientError,
  jellyseerrRequest,
  getJellyseerrConfig,
  getPosterUrl,
} from "./client";
