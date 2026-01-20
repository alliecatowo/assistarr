// Tool Result Renderers
// Export barrel for all tool result components

export { ToolResultRenderer, hasRichRenderer } from "./renderer";
export { GenericResult, ErrorResult } from "./generic-result";
export { MediaCard, type MediaCardProps, type MediaStatus } from "./media-card";
export { MediaResultsView, SearchResultsView, type LayoutMode } from "./media-results-view";
export { CalendarView, MovieCalendarView, EpisodeCalendarView } from "./calendar-view";
export { QueueView, ArrQueueView, TorrentQueueView } from "./queue-view";

// Type exports
export type {
  ToolResultProps,
  NormalizedMediaItem,
  ToolState,
  // Media shapes
  MediaItemShape,
  MediaResultsShape,
  // Calendar shapes
  MovieCalendarItem,
  EpisodeCalendarItem,
  MovieCalendarShape,
  EpisodeCalendarShape,
  // Queue shapes
  ArrQueueItem,
  TorrentItem,
  ArrQueueShape,
  TorrentQueueShape,
} from "./types";

// Utility exports
export {
  TMDB_POSTER_BASE,
  TMDB_POSTER_W185,
  TMDB_POSTER_W342,
  TMDB_POSTER_W500,
  TMDB_BACKDROP_W780,
  isMediaItem,
  isMediaResultsShape,
  isCalendarShape,
  isMovieCalendarShape,
  isEpisodeCalendarShape,
  isQueueShape,
  isArrQueueShape,
  isTorrentQueueShape,
  detectResultType,
} from "./types";
