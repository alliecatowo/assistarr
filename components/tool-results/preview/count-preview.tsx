"use client";

import { cn } from "@/lib/utils";

interface CountPreviewProps {
  count: number;
  /** Label to show after count (default: "items") */
  label?: string;
  className?: string;
}

/**
 * Simple count preview showing "N items" badge.
 * Used when there are too many items for a detailed preview.
 */
export function CountPreview({
  count,
  label = "items",
  className,
}: CountPreviewProps) {
  const displayLabel = count === 1 ? label.replace(/s$/, "") : label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground",
        className
      )}
    >
      <span className="font-medium tabular-nums">{count}</span>
      <span>{displayLabel}</span>
    </span>
  );
}
