/**
 * Display system for progressive disclosure of tool results.
 *
 * This module provides context-aware display decisions for tool results,
 * enabling progressive disclosure based on item count, user preferences, and mode.
 */

// Heuristics exports
export {
  computeDisplayState,
  getDefaultOpenState,
  shouldUseArtifactWrapper,
} from "./heuristics";
// Registry exports
export { DISPLAY_PREFERENCES, getDisplayPreferences } from "./registry";
// Type exports
export type {
  ComputedDisplayState,
  DisplayContext,
  DisplayLevel,
  DisplayPreferences,
  DisplayResultType,
  PreviewConfig,
  PreviewType,
} from "./types";
// Utility exports
export { DEFAULT_DISPLAY_CONTEXT, extractItemCount } from "./types";
