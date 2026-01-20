export type { JellyfinConfig } from "./client";
// Re-export client utilities
export {
  calculateProgressPercentage,
  formatDuration,
  getImageUrl,
  getJellyfinConfig,
  JellyfinClientError,
  jellyfinRequest,
  ticksToMinutes,
  ticksToSeconds,
} from "./client";
export { getContinueWatching } from "./get-continue-watching";
export { getRecentlyAdded } from "./get-recently-added";
export { searchMedia } from "./search-media";
// Re-export types for consumers
export type {
  ImageTags,
  ItemsResponse,
  JellyfinError,
  LibrariesResponse,
  Library,
  MediaItem,
  MediaType,
  Person,
  SearchHint,
  SearchResponse,
  Studio,
  UserData,
} from "./types";
