/**
 * Display preferences registry for tool result types.
 *
 * Maps result types to their display preferences, enabling the display
 * system to know how to handle each type of result.
 */

import type { DisplayPreferences, DisplayResultType } from "./types";

/**
 * Default display preferences for result types.
 *
 * These preferences define:
 * - How results should be displayed by default
 * - When to use inline vs collapsed vs expanded views
 * - What kind of preview to show when collapsed
 * - Item count thresholds for automatic behavior
 */
export const DISPLAY_PREFERENCES: Record<
  DisplayResultType,
  DisplayPreferences
> = {
  /**
   * Media results (search, library, discovery sections)
   * - Many results: collapsed with mini poster strip
   * - Few results: inline compact display
   */
  "media-results": {
    defaultLevel: "collapsed",
    collapsible: true,
    preview: {
      type: "items",
      maxItems: 3,
    },
    countThresholds: {
      inline: 3, // Show inline for ≤3 items
      collapsedWithPreview: 10, // Show poster preview for ≤10, count only for more
    },
    debugModeOverride: "collapsed",
  },

  /**
   * Download queue (Radarr/Sonarr/qBittorrent)
   * - Shows status summary (downloading, stalled, etc.)
   * - Higher inline threshold since queue items are more compact
   */
  queue: {
    defaultLevel: "inline",
    collapsible: true,
    preview: {
      type: "status",
    },
    countThresholds: {
      inline: 5, // Show inline for ≤5 items
      collapsedWithPreview: 15, // Show status preview for ≤15
    },
    debugModeOverride: "collapsed",
  },

  /**
   * Calendar view (upcoming releases)
   * - Shows summary of upcoming releases
   * - Lower inline threshold due to vertical space
   */
  calendar: {
    defaultLevel: "collapsed",
    collapsible: true,
    preview: {
      type: "summary",
    },
    countThresholds: {
      inline: 2, // Show inline for ≤2 items
      collapsedWithPreview: 10, // Show summary for ≤10
    },
    debugModeOverride: "collapsed",
  },

  /**
   * Discovery results (trending, popular sections)
   * - Similar to media results but with section awareness
   */
  discovery: {
    defaultLevel: "collapsed",
    collapsible: true,
    preview: {
      type: "items",
      maxItems: 3,
    },
    countThresholds: {
      inline: 0, // Never inline (always has multiple sections)
      collapsedWithPreview: 12,
    },
    debugModeOverride: "collapsed",
  },

  /**
   * Success confirmation cards (request approved, add completed)
   * - Always show inline, no collapsing
   * - Compact single-item display
   */
  success: {
    defaultLevel: "inline",
    collapsible: false,
    preview: {
      type: "none",
    },
    countThresholds: {
      inline: 1,
      collapsedWithPreview: 0,
    },
  },

  /**
   * Generic/JSON results
   * - Default collapsible behavior
   * - Shows count only in preview
   */
  generic: {
    defaultLevel: "collapsed",
    collapsible: true,
    preview: {
      type: "count",
    },
    countThresholds: {
      inline: 1, // Show inline only for single-item results
      collapsedWithPreview: 0, // Always just count for generic
    },
    debugModeOverride: "expanded", // Debug mode expands generic results
  },
};

/**
 * Get display preferences for a result type.
 * Falls back to generic preferences if type is not found.
 */
export function getDisplayPreferences(
  resultType: DisplayResultType | null
): DisplayPreferences {
  if (resultType && resultType in DISPLAY_PREFERENCES) {
    return DISPLAY_PREFERENCES[resultType];
  }
  return DISPLAY_PREFERENCES.generic;
}
