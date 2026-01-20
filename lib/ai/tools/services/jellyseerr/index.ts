// Re-export client utilities
export {
  getJellyseerrConfig,
  getPosterUrl,
  JellyseerrClientError,
  jellyseerrRequest,
} from "./client";
export { deleteRequest } from "./delete-request";
export { getDiscovery } from "./get-discovery";
export { getRequests } from "./get-requests";
export { requestMedia } from "./request-media";
export { searchContent } from "./search-content";
// Re-export types for convenience
export type {
  JellyseerrUser,
  MediaInfo,
  MediaRequest,
  MediaType,
  MovieDetails,
  MovieSearchResult,
  RequestsResponse,
  SearchResponse,
  SearchResult,
  TvDetails,
  TvSearchResult,
} from "./types";
export {
  getMediaStatusText,
  getRequestStatusText,
  getResultDate,
  getResultTitle,
  getResultYear,
  isMovieResult,
  isTvResult,
  MediaStatus,
  RequestStatus,
} from "./types";
