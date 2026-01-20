"use client";

import type { ReactNode } from "react";
import { CalendarView } from "./calendar-view";
import { ErrorResult, GenericResult } from "./generic-result";
import { MediaResultsView } from "./media-results-view";
import { QueueView } from "./queue-view";
import {
  detectResultType,
  type ToolState,
} from "./types";

interface ToolResultRendererProps {
  toolName: string;
  output: unknown;
  state: ToolState;
  input?: unknown;
}

/**
 * Main dispatcher that routes tool outputs to specialized renderers.
 *
 * IMPORTANT: This uses SHAPE DETECTION (duck typing) instead of hardcoded tool names.
 * Any tool that returns data matching a known shape will automatically get the
 * appropriate rich renderer. This makes the system extensible for plugins.
 *
 * Shape detection order:
 * 1. Check for error shape → ErrorResult
 * 2. Check for calendar shape (has `movies` or `episodes` array) → CalendarView
 * 3. Check for queue shape (has `queue` array) → QueueView
 * 4. Check for media results shape (has `results` array with media items) → MediaResultsView
 * 5. Fallback: GenericResult (JSON display)
 */
export function ToolResultRenderer({
  toolName,
  output,
  state,
  input,
}: ToolResultRendererProps): ReactNode {
  // Only render output when available
  if (state !== "output-available") {
    return null;
  }

  // 1. Handle error outputs
  if (output && typeof output === "object" && "error" in output) {
    return <ErrorResult error={(output as { error: unknown }).error} />;
  }

  // 2. Detect result type by shape (not tool name!)
  const resultType = detectResultType(output);

  switch (resultType) {
    case "calendar":
      // Shape: { movies: [...] } or { episodes: [...] }
      // Works for: getRadarrCalendar, getSonarrCalendar
      return <CalendarView output={output as any} state={state} />;

    case "queue":
      // Shape: { queue: [{ title, status, progress?, ... }] }
      // Works for: getRadarrQueue, getSonarrQueue, getTorrents
      return <QueueView output={output as any} state={state} />;

    case "media-results":
      // Shape: { results: [{ title, year?, posterUrl?, ... }], message? }
      // Works for: search results, library lists, discovery, any media collection
      return (
        <MediaResultsView
          output={output as any}
          state={state}
          toolName={toolName}
        />
      );

    default:
      // Fallback: show raw JSON
      return <GenericResult output={output} state={state} input={input} />;
  }
}

/**
 * Helper to check if output should use a rich renderer.
 * Uses shape detection - any output matching a known shape gets rich rendering.
 */
export function hasRichRenderer(output: unknown): boolean {
  return detectResultType(output) !== null;
}

/**
 * @deprecated Use shape detection instead of tool name checking.
 * Kept for backwards compatibility during transition.
 */
export function hasRichRendererByName(toolName: string): boolean {
  // This is the old approach - checking tool names
  // Now we use shape detection instead
  const richRendererTools = [
    "searchContent",
    "searchRadarrMovies",
    "searchSonarrSeries",
    "getRadarrLibrary",
    "getSonarrLibrary",
    "getDiscovery",
  ];
  return richRendererTools.includes(toolName);
}
