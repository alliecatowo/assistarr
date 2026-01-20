export { searchSeries } from "./search-series";
export { addSeries } from "./add-series";
export { getQueue } from "./get-queue";
export { getCalendar } from "./get-calendar";

// Re-export types for convenience
export type * from "./types";

// Re-export client utilities
export { sonarrRequest, getSonarrConfig, SonarrClientError } from "./client";
