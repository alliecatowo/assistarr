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
   * - Always collapsed with mini poster strip
   */
  "media-results": {
    defaultLevel: "collapsed",
    collapsible: true,
    preview: {
      type: "items",
      maxItems: 3,
    },
    countThresholds: {
      inline: 0, // Never inline - always use wrapper
      collapsedWithPreview: 20, // Show poster preview for ≤20
    },
    debugModeOverride: "collapsed",
  },

  /**
   * Download queue (Radarr/Sonarr/qBittorrent)
   * - Shows status summary (downloading, stalled, etc.)
   * - Always collapsed with status preview
   */
  queue: {
    defaultLevel: "collapsed",
    collapsible: true,
    preview: {
      type: "status",
    },
    countThresholds: {
      inline: 0, // Never inline - always use wrapper
      collapsedWithPreview: 20, // Show status preview for ≤20
    },
    debugModeOverride: "collapsed",
  },

  /**
   * Calendar view (upcoming releases)
   * - Shows summary of upcoming releases
   * - Always collapsed with summary preview
   */
  calendar: {
    defaultLevel: "collapsed",
    collapsible: true,
    preview: {
      type: "summary",
    },
    countThresholds: {
      inline: 0, // Never inline - always use wrapper
      collapsedWithPreview: 15, // Show summary for ≤15
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
   * Recommendations from the recommendMedia tool
   * - Always collapsed with poster preview
   */
  recommendation: {
    defaultLevel: "collapsed",
    collapsible: true,
    preview: {
      type: "items",
      maxItems: 4,
    },
    countThresholds: {
      inline: 0, // Never inline - always use wrapper
      collapsedWithPreview: 15,
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
      inline: 0, // Never inline - always use wrapper
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
