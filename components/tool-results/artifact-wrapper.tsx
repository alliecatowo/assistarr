"use client";

import type { ToolUIPart } from "ai";
import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { ArtifactHeader } from "./artifact-header";
import {
  computeDisplayState,
  type DisplayContext,
  type DisplayResultType,
  getDefaultOpenState,
  shouldUseArtifactWrapper,
} from "./display";

export interface ArtifactWrapperProps {
  /** Tool display name */
  toolName: string;
  /** Tool state */
  state: ToolUIPart["state"];
  /** Approval response for status badge */
  approval?: { approved?: boolean };
  /** Detected result type */
  resultType: DisplayResultType | null;
  /** Tool output data */
  output: unknown;
  /** Display context from chat */
  displayContext?: DisplayContext;
  /** Content to render inside the wrapper */
  children: ReactNode;
  className?: string;
}

/**
 * Universal artifact wrapper that provides progressive disclosure for tool results.
 *
 * Features:
 * - Computes display state from result type, output, and context
 * - Shows collapsible header with preview when appropriate
 * - Handles expand/collapse state with smooth animation
 * - Passes through inline results without wrapper
 */
export function ArtifactWrapper({
  toolName,
  state,
  approval,
  resultType,
  output,
  displayContext,
  children,
  className,
}: ArtifactWrapperProps) {
  // Compute display state
  const displayState = computeDisplayState(resultType, output, displayContext);

  // Local expand state, initialized from heuristics
  const [isExpanded, setIsExpanded] = useState(() =>
    getDefaultOpenState(displayState)
  );

  // If display level is "inline", render children directly without wrapper
  if (!shouldUseArtifactWrapper(displayState)) {
    return <div className={cn("w-full", className)}>{children}</div>;
  }

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-md border bg-card",
        "transition-all duration-200",
        className
      )}
    >
      {/* Header with preview */}
      <ArtifactHeader
        approval={approval}
        displayState={displayState}
        isExpanded={isExpanded}
        onToggle={handleToggle}
        output={output}
        state={state}
        toolName={toolName}
      />

      {/* Content (collapsible) */}
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "border-t",
              // Add scroll container for large results
              displayState.itemCount > 10 && "max-h-[60vh] overflow-y-auto"
            )}
          >
            <div className="p-3">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Simplified wrapper for non-rich results that still need collapsible UI.
 * Used by the Tool component pattern.
 */
export interface SimpleArtifactWrapperProps {
  /** Tool display name */
  toolName: string;
  /** Tool state */
  state: ToolUIPart["state"];
  /** Approval response for status badge */
  approval?: { approved?: boolean };
  /** Whether to start expanded */
  defaultOpen?: boolean;
  /** Content to render */
  children: ReactNode;
  className?: string;
}

export function SimpleArtifactWrapper({
  toolName,
  state,
  approval,
  defaultOpen = false,
  children,
  className,
}: SimpleArtifactWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  // Create a minimal display state for the header
  const displayState = {
    level: "collapsed" as const,
    isCollapsible: true,
    showPreview: false,
    previewType: "count" as const,
    previewMaxItems: 0,
    itemCount: 0,
    isUserOverride: false,
  };

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-md border bg-card",
        "transition-all duration-200",
        className
      )}
    >
      <ArtifactHeader
        approval={approval}
        displayState={displayState}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded((prev) => !prev)}
        output={null}
        state={state}
        toolName={toolName}
      />

      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t">{children}</div>
        </div>
      </div>
    </div>
  );
}
