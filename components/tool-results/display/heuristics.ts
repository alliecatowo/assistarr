/**
 * Display state computation for tool results.
 *
 * This module computes the final display state based on explicit preferences.
 * No smart guessing - display behavior is predictable based on:
 * 1. User overrides (clicking expand/collapse)
 * 2. Debug mode overrides
 * 3. Explicit defaultLevel from registry
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
 * Compute the display state for a tool result.
 *
 * Simple priority order:
 * 1. User override (they clicked expand/collapse)
 * 2. Debug mode override
 * 3. Default level from preferences (no guessing)
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

  let level: DisplayLevel = preferences.defaultLevel;
  let isUserOverride = false;

  // 1. User override (they clicked expand/collapse)
  if (context.userExpandedOverride !== undefined) {
    level = context.userExpandedOverride ? "expanded" : "collapsed";
    isUserOverride = true;
  }
  // 2. Debug mode override
  else if (context.mode === "debug" && preferences.debugModeOverride) {
    level = preferences.debugModeOverride;
  }
  // 3. Use default level from preferences (no count-based logic)

  // Show preview when collapsed and have items within threshold
  const showPreview =
    level === "collapsed" &&
    itemCount > 0 &&
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
 * Check if a result should use the artifact wrapper.
 *
 * Returns true for collapsible results (most things).
 * Returns false for non-collapsible results (success cards).
 */
export function shouldUseArtifactWrapper(state: ComputedDisplayState): boolean {
  return state.isCollapsible;
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
