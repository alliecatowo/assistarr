/**
 * Display system types for progressive disclosure of tool results.
 *
 * This module defines the type system for context-aware display of tool results,
 * enabling progressive disclosure based on item count, user preferences, and mode.
 */

// ============================================================================
// DISPLAY LEVEL
// ============================================================================

/**
 * Display preference levels for tool results.
 * - "inline": Show content directly without wrapper (for small results)
 * - "collapsed": Show collapsed header with preview, expandable on click
 * - "expanded": Show full content expanded by default
 */
export type DisplayLevel = "inline" | "collapsed" | "expanded";

// ============================================================================
// DISPLAY CONTEXT
// ============================================================================

/**
 * Context for display decisions, passed from the chat component.
 */
export interface DisplayContext {
  /** Current display mode */
  mode: "normal" | "debug" | "compact";
  /** Whether this is the latest message in the chat */
  isLatestMessage?: boolean;
  /** User has explicitly expanded/collapsed this result */
  userExpandedOverride?: boolean;
}

/**
 * Default display context when none is provided.
 */
export const DEFAULT_DISPLAY_CONTEXT: DisplayContext = {
  mode: "normal",
  isLatestMessage: true,
  userExpandedOverride: undefined,
};

// ============================================================================
// PREVIEW TYPES
// ============================================================================

/**
 * Types of previews that can be shown in collapsed state.
 * - "count": Just show item count (e.g., "47 items")
 * - "items": Show mini poster strip (e.g., 3 posters + "+44")
 * - "status": Show status summary (e.g., "2 downloading, 1 stalled")
 * - "summary": Show text summary (e.g., "3 movies releasing this week")
 */
export type PreviewType = "count" | "items" | "status" | "summary" | "none";

/**
 * Configuration for how to render previews.
 */
export interface PreviewConfig {
  /** Type of preview to show */
  type: PreviewType;
  /** Maximum items to show in items preview (default: 3) */
  maxItems?: number;
}

// ============================================================================
// DISPLAY PREFERENCES
// ============================================================================

/**
 * Display preferences for a specific result type.
 * Configures how results of this type should be displayed by default.
 */
export interface DisplayPreferences {
  /** Default display level when no context overrides apply */
  defaultLevel: DisplayLevel;
  /** Whether this result type can be collapsed/expanded */
  collapsible: boolean;
  /** Preview configuration when collapsed */
  preview: PreviewConfig;
  /** Thresholds for display behavior */
  countThresholds: {
    /** Reserved for future use (display level is now explicit via defaultLevel) */
    inline: number;
    /** Show collapsed with poster/item preview if count <= this value */
    collapsedWithPreview: number;
  };
  /** Override display level in debug mode */
  debugModeOverride?: DisplayLevel;
}

// ============================================================================
// COMPUTED DISPLAY STATE
// ============================================================================

/**
 * Computed display state after applying all heuristics.
 * This is the final state used by the artifact wrapper.
 */
export interface ComputedDisplayState {
  /** Final display level to use */
  level: DisplayLevel;
  /** Whether the result can be collapsed/expanded by user */
  isCollapsible: boolean;
  /** Whether to show preview in collapsed state */
  showPreview: boolean;
  /** Type of preview to show (if showPreview is true) */
  previewType: PreviewType;
  /** Number of items to show in preview (for items preview) */
  previewMaxItems: number;
  /** Total item count for display */
  itemCount: number;
  /** Whether user has explicitly toggled this state */
  isUserOverride: boolean;
}

// ============================================================================
// RESULT TYPE MAPPING
// ============================================================================

/**
 * Supported result types for display preferences.
 */
export type DisplayResultType =
  | "media-results"
  | "queue"
  | "calendar"
  | "discovery"
  | "success"
  | "recommendation"
  | "generic";

// ============================================================================
// ITEM COUNT EXTRACTION
// ============================================================================

/**
 * Extract item count from tool output.
 * Handles various output shapes to find the total count.
 */
export function extractItemCount(output: unknown): number {
  if (!output || typeof output !== "object") {
    return 0;
  }

  const obj = output as Record<string, unknown>;

  // Media results shape
  if (Array.isArray(obj.results)) {
    return obj.results.length;
  }

  // Calendar shapes
  if (Array.isArray(obj.movies)) {
    return obj.movies.length;
  }
  if (Array.isArray(obj.episodes)) {
    return obj.episodes.length;
  }

  // Queue shapes
  if (Array.isArray(obj.items)) {
    return obj.items.length;
  }
  if (Array.isArray(obj.torrents)) {
    return obj.torrents.length;
  }

  // Discovery shape
  if (Array.isArray(obj.sections)) {
    return (obj.sections as Array<{ items?: unknown[] }>).reduce(
      (sum, section) => sum + (section.items?.length ?? 0),
      0
    );
  }

  return 0;
}
