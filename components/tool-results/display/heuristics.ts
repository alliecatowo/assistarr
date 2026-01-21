/**
 * Display heuristics for computing final display state.
 *
 * This module applies context and preferences to compute the final
 * display state for tool results.
 */

import { getDisplayPreferences } from "./registry";
import {
  type ComputedDisplayState,
  DEFAULT_DISPLAY_CONTEXT,
  type DisplayContext,
  type DisplayLevel,
  type DisplayResultType,
  extractItemCount,
} from "./types";

/**
 * Detect if the output contains actionable issues (errors, stalled items, warnings).
 */
function detectActionableIssues(output: unknown): boolean {
  if (!output || typeof output !== "object") {
    return false;
  }

  const obj = output as Record<string, unknown>;

  // Check queue items for errors/stalled
  if (Array.isArray(obj.items)) {
    // biome-ignore lint/suspicious/noExplicitAny: Generic item check
    return obj.items.some((item: any) => {
      const status = item.status?.toLowerCase() || "";
      return (
        status.includes("error") ||
        status.includes("stall") ||
        status.includes("warning") ||
        status.includes("failed") ||
        !!item.errorMessage
      );
    });
  }

  // Check torrents for errors/stalled
  if (Array.isArray(obj.torrents)) {
    // biome-ignore lint/suspicious/noExplicitAny: Generic torrent check
    return obj.torrents.some((item: any) => {
      const state =
        item.rawState?.toLowerCase() || item.state?.toLowerCase() || "";
      return (
        state.includes("error") ||
        state.includes("stall") ||
        state.includes("warning")
      );
    });
  }

  return false;
}

/**
 * Compute the display state for a tool result.
 *
 * Applies heuristics in the following order:
 * 1. User override (if set, use it directly)
 * 2. Debug mode override (if in debug mode)
 * 3. Investigation mode (if user is investigating/checking)
 * 4. Actionable issues (prioritize showing issues)
 * 5. Item count thresholds
 * 6. Default level from preferences
 *
 * @param resultType - The detected type of the result
 * @param output - The tool output data
 * @param context - Display context from chat component
 * @returns Computed display state for the artifact wrapper
 */
export function computeDisplayState(
  resultType: DisplayResultType | null,
  output: unknown,
  context: DisplayContext = DEFAULT_DISPLAY_CONTEXT
): ComputedDisplayState {
  const preferences = getDisplayPreferences(resultType);
  const itemCount = extractItemCount(output);

  // Detect actionable issues if not explicitly set
  const hasActionableIssues =
    context.hasActionableIssues ?? detectActionableIssues(output);

  // Start with defaults
  let level: DisplayLevel = preferences.defaultLevel;
  let isUserOverride = false;

  // 1. Apply user override if set
  if (context.userExpandedOverride !== undefined) {
    level = context.userExpandedOverride ? "expanded" : "collapsed";
    isUserOverride = true;
  }
  // 2. Apply debug mode override
  else if (context.mode === "debug" && preferences.debugModeOverride) {
    level = preferences.debugModeOverride;
  }
  // 3. Investigation mode - always expand
  else if (context.isInvestigation) {
    level = "expanded";
  }
  // 4. Actionable issues - prefer expanded for queue/torrent with issues
  else if (
    hasActionableIssues &&
    (resultType === "queue" || resultType === "generic")
  ) {
    // Show expanded if there are issues and reasonable item count
    level = itemCount <= 20 ? "expanded" : "collapsed";
  }
  // 5. Apply item count thresholds
  else {
    level = computeLevelFromCount(itemCount, preferences.countThresholds);
  }

  // Determine preview settings
  const showPreview =
    level === "collapsed" &&
    itemCount <= preferences.countThresholds.collapsedWithPreview;

  return {
    level,
    isCollapsible: preferences.collapsible,
    showPreview,
    previewType: preferences.preview.type,
    previewMaxItems: preferences.preview.maxItems ?? 3,
    itemCount,
    isUserOverride,
  };
}

/**
 * Compute display level based on item count and thresholds.
 */
function computeLevelFromCount(
  count: number,
  thresholds: { inline: number; collapsedWithPreview: number }
): DisplayLevel {
  // Very few items: show inline
  if (count <= thresholds.inline) {
    return "inline";
  }

  // Default to collapsed for any count above inline threshold
  return "collapsed";
}

/**
 * Check if a result should use the artifact wrapper.
 *
 * Returns false for results that should render without any wrapper,
 * typically very small results in inline mode.
 */
export function shouldUseArtifactWrapper(state: ComputedDisplayState): boolean {
  // Inline results don't use the wrapper
  if (state.level === "inline") {
    return false;
  }

  // All other levels use the wrapper
  return true;
}

/**
 * Get the default open state for collapsible wrapper.
 */
export function getDefaultOpenState(state: ComputedDisplayState): boolean {
  // Expanded level starts open
  if (state.level === "expanded") {
    return true;
  }

  // User explicitly expanded
  if (state.isUserOverride && state.level !== "collapsed") {
    return true;
  }

  // Default to closed
  return false;
}
