"use client";

import type { PreviewType } from "../display";
import { CountPreview } from "./count-preview";
import { ItemsPreview } from "./items-preview";
import { StatusPreview } from "./status-preview";
import { SummaryPreview } from "./summary-preview";

// Re-export individual components
export { CountPreview } from "./count-preview";
export { ItemsPreview } from "./items-preview";
export { StatusPreview } from "./status-preview";
export { SummaryPreview } from "./summary-preview";

interface PreviewRouterProps {
  /** Type of preview to render */
  previewType: PreviewType;
  /** Tool output data */
  output: unknown;
  /** Total item count */
  itemCount: number;
  /** Max items for items preview */
  maxItems?: number;
  className?: string;
}

/**
 * Extract media items from output for items preview.
 */
function extractMediaItems(
  output: unknown
): Array<{
  title: string;
  posterUrl?: string | null;
  imageUrl?: string | null;
}> {
  if (!output || typeof output !== "object") {
    return [];
  }

  const obj = output as Record<string, unknown>;

  // Media results shape
  if (Array.isArray(obj.results)) {
    return obj.results as Array<{
      title: string;
      posterUrl?: string | null;
      imageUrl?: string | null;
    }>;
  }

  // Discovery shape - flatten all sections
  if (Array.isArray(obj.sections)) {
    return (
      obj.sections as Array<{
        items?: Array<{
          title: string;
          posterUrl?: string | null;
          imageUrl?: string | null;
        }>;
      }>
    ).flatMap((section) => section.items ?? []);
  }

  return [];
}

/**
 * Get label for count preview based on output type.
 */
function getCountLabel(output: unknown): string {
  if (!output || typeof output !== "object") {
    return "items";
  }

  const obj = output as Record<string, unknown>;

  if ("movies" in obj) return "movies";
  if ("episodes" in obj) return "episodes";
  if ("torrents" in obj) return "torrents";
  if ("items" in obj) return "items";
  if ("results" in obj) return "results";

  return "items";
}

/**
 * Preview router component that renders the appropriate preview
 * based on the preview type and output data.
 */
export function PreviewRouter({
  previewType,
  output,
  itemCount,
  maxItems = 3,
  className,
}: PreviewRouterProps) {
  switch (previewType) {
    case "count":
      return (
        <CountPreview
          className={className}
          count={itemCount}
          label={getCountLabel(output)}
        />
      );

    case "items": {
      const items = extractMediaItems(output);
      if (items.length === 0) {
        return (
          <CountPreview
            className={className}
            count={itemCount}
            label={getCountLabel(output)}
          />
        );
      }
      return (
        <ItemsPreview
          className={className}
          items={items}
          maxItems={maxItems}
          totalCount={itemCount}
        />
      );
    }

    case "status":
      // Status preview needs queue-shaped output
      if (
        output &&
        typeof output === "object" &&
        ("items" in output || "torrents" in output)
      ) {
        return <StatusPreview className={className} output={output as any} />;
      }
      // Fallback to count
      return (
        <CountPreview
          className={className}
          count={itemCount}
          label={getCountLabel(output)}
        />
      );

    case "summary":
      return <SummaryPreview className={className} output={output} />;

    default:
      return (
        <CountPreview
          className={className}
          count={itemCount}
          label={getCountLabel(output)}
        />
      );
  }
}
