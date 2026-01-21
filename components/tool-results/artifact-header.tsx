"use client";

import type { ToolUIPart } from "ai";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ComputedDisplayState } from "./display";
import { PreviewRouter } from "./preview";

export interface ArtifactHeaderProps {
  /** Tool display name (e.g., "Search Movies (Radarr)") */
  toolName: string;
  /** Tool state for status badge */
  state: ToolUIPart["state"];
  /** Approval response for status badge */
  approval?: { approved?: boolean };
  /** Computed display state from heuristics */
  displayState: ComputedDisplayState;
  /** Tool output for preview generation */
  output: unknown;
  /** Whether the content is currently expanded */
  isExpanded: boolean;
  /** Callback when header is clicked */
  onToggle: () => void;
  className?: string;
}

/**
 * Get status badge for tool state.
 */
function getStatusBadge(
  status: ToolUIPart["state"],
  approval?: { approved?: boolean }
) {
  // For approval-responded, check actual approval value
  const wasApproved = approval?.approved !== false;

  const labels: Record<ToolUIPart["state"], string> = {
    "input-streaming": "Pending",
    "input-available": "Running",
    "approval-requested": "Pending",
    "approval-responded": wasApproved ? "Approved" : "Denied",
    "output-available": "Completed",
    "output-error": "Error",
    "output-denied": "Denied",
  };

  const icons: Record<ToolUIPart["state"], ReactNode> = {
    "input-streaming": <CircleIcon className="size-3" />,
    "input-available": <ClockIcon className="size-3 animate-pulse" />,
    "approval-requested": <ClockIcon className="size-3 text-yellow-600" />,
    "approval-responded": wasApproved ? (
      <CheckCircleIcon className="size-3 text-blue-600" />
    ) : (
      <XCircleIcon className="size-3 text-orange-600" />
    ),
    "output-available": <CheckCircleIcon className="size-3 text-green-600" />,
    "output-error": <XCircleIcon className="size-3 text-red-600" />,
    "output-denied": <XCircleIcon className="size-3 text-orange-600" />,
  };

  return (
    <Badge
      className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]"
      variant="secondary"
    >
      {icons[status]}
      <span>{labels[status]}</span>
    </Badge>
  );
}

/**
 * Artifact header component with preview and expand/collapse functionality.
 *
 * Layout:
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ 🔧 Tool Name    [Preview]  [Count Badge]  [Status]  ▾              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function ArtifactHeader({
  toolName,
  state,
  approval,
  displayState,
  output,
  isExpanded,
  onToggle,
  className,
}: ArtifactHeaderProps) {
  const {
    showPreview,
    previewType,
    previewMaxItems,
    itemCount,
    isCollapsible,
  } = displayState;

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-2 p-3",
        "text-left transition-colors",
        isCollapsible && "hover:bg-muted/50",
        className
      )}
    >
      {/* Left side: Icon + Name (clickable for toggle) */}
      <button
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2",
          isCollapsible && "cursor-pointer",
          !isCollapsible && "cursor-default"
        )}
        disabled={!isCollapsible}
        onClick={isCollapsible ? onToggle : undefined}
        type="button"
      >
        <WrenchIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate font-medium text-sm">{toolName}</span>
      </button>

      {/* Right side: Preview + Count + Status + Chevron */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Preview (only when collapsed and has items) */}
        {!isExpanded && showPreview && itemCount > 0 && (
          <PreviewRouter
            itemCount={itemCount}
            maxItems={previewMaxItems}
            output={output}
            previewType={previewType}
          />
        )}

        {/* Item count badge (when collapsed and not showing item preview) */}
        {!isExpanded &&
          itemCount > 0 &&
          (previewType !== "items" || !showPreview) && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground tabular-nums">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          )}

        {/* Status badge */}
        {getStatusBadge(state, approval)}

        {/* Expand/collapse chevron */}
        {isCollapsible && (
          <button
            className="text-muted-foreground"
            onClick={onToggle}
            type="button"
          >
            <ChevronDownIcon
              className={cn(
                "size-4 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </button>
        )}
      </div>
    </div>
  );
}
