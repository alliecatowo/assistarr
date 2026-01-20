// Tool Result Renderers
// Export barrel for all tool result components

export {
  CalendarView,
  EpisodeCalendarView,
  MovieCalendarView,
} from "./calendar-view";
export { ErrorResult, GenericResult } from "./generic-result";
export { MediaCard, type MediaCardProps, type MediaStatus } from "./media-card";
export {
  type LayoutMode,
  MediaResultsView,
  SearchResultsView,
} from "./media-results-view";
export { ArrQueueView, QueueView, TorrentQueueView } from "./queue-view";
export { hasRichRenderer, ToolResultRenderer } from "./renderer";

// Type exports
export type {
  // Queue shapes
  ArrQueueItem,
  ArrQueueShape,
  EpisodeCalendarItem,
  EpisodeCalendarShape,
  // Media shapes
  MediaItemShape,
  MediaResultsShape,
  // Calendar shapes
  MovieCalendarItem,
  MovieCalendarShape,
  NormalizedMediaItem,
  ToolResultProps,
  ToolState,
  TorrentItem,
  TorrentQueueShape,
} from "./types";

// Utility exports
export {
  detectResultType,
  isArrQueueShape,
  isCalendarShape,
  isEpisodeCalendarShape,
  isMediaItem,
  isMediaResultsShape,
  isMovieCalendarShape,
  isQueueShape,
  isTorrentQueueShape,
  TMDB_BACKDROP_W780,
  TMDB_POSTER_BASE,
  TMDB_POSTER_W185,
  TMDB_POSTER_W342,
  TMDB_POSTER_W500,
} from "./types";
