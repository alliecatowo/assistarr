// Tool Result Renderers
// Export barrel for all tool result components

// Artifact wrapper system
export { ArtifactHeader, type ArtifactHeaderProps } from "./artifact-header";
export {
  ArtifactWrapper,
  type ArtifactWrapperProps,
  SimpleArtifactWrapper,
  type SimpleArtifactWrapperProps,
} from "./artifact-wrapper";
// View components
export {
  CalendarView,
  EpisodeCalendarView,
  MovieCalendarView,
} from "./calendar-view";
// Display system
export {
  type ComputedDisplayState,
  computeDisplayState,
  DEFAULT_DISPLAY_CONTEXT,
  DISPLAY_PREFERENCES,
  type DisplayContext,
  type DisplayLevel,
  type DisplayPreferences,
  type DisplayResultType,
  extractItemCount,
  getDefaultOpenState,
  getDisplayPreferences,
  type PreviewConfig,
  type PreviewType,
  shouldUseArtifactWrapper,
} from "./display";
export { ErrorResult, GenericResult } from "./generic-result";
export { MediaCard, type MediaCardProps, type MediaStatus } from "./media-card";
export {
  type LayoutMode,
  MediaResultsView,
  SearchResultsView,
} from "./media-results-view";
// Preview components
export {
  CountPreview,
  ItemsPreview,
  PreviewRouter,
  StatusPreview,
  SummaryPreview,
} from "./preview";
export { ArrQueueView, QueueView, TorrentQueueView } from "./queue-view";
export { hasRichRenderer, ToolResultRenderer } from "./renderer";
export { SuccessCard } from "./success-card";

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
  // Success confirmation shape
  SuccessConfirmationShape,
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
  isSuccessConfirmationShape,
  isTorrentQueueShape,
  TMDB_BACKDROP_W780,
  TMDB_POSTER_BASE,
  TMDB_POSTER_W185,
  TMDB_POSTER_W342,
  TMDB_POSTER_W500,
} from "./types";
