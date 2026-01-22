"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { TMDB_POSTER_W185 } from "../types";

interface MediaPreviewItem {
  title: string;
  posterUrl?: string | null;
  imageUrl?: string | null; // Jellyfin alias
}

interface ItemsPreviewProps {
  /** Items to show in preview */
  items: MediaPreviewItem[];
  /** Maximum items to show (default: 3) */
  maxItems?: number;
  /** Total item count for "+N" badge */
  totalCount: number;
  className?: string;
}

/**
 * Get poster URL from item, handling various field names.
 */
function getPosterUrl(item: MediaPreviewItem): string | null {
  const url = item.posterUrl ?? item.imageUrl;
  if (!url) {
    return null;
  }
  // Handle TMDB paths
  if (url.startsWith("/")) {
    return `${TMDB_POSTER_W185}${url}`;
  }
  return url;
}

/**
 * Mini poster strip preview showing small thumbnails of media items.
 * Shows up to maxItems posters with a "+N more" badge if there are more.
 */
export function ItemsPreview({
  items,
  maxItems = 3,
  totalCount,
  className,
}: ItemsPreviewProps) {
  const displayItems = items.slice(0, maxItems);
  const remaining = totalCount - displayItems.length;

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {/* Mini poster strip */}
      <div className="flex -space-x-1">
        {displayItems.map((item, index) => {
          const posterUrl = getPosterUrl(item);

          return (
            <div
              className={cn(
                "relative h-8 w-5 overflow-hidden rounded-sm border border-background bg-muted",
                "shadow-sm ring-1 ring-border/50"
              )}
              key={`${item.title}-${index}`}
              style={{ zIndex: maxItems - index }}
              title={item.title}
            >
              {posterUrl ? (
                <Image
                  alt=""
                  className="object-cover"
                  fill
                  sizes="20px"
                  src={posterUrl}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-[6px] text-muted-foreground">
                  ?
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* "+N more" badge */}
      {remaining > 0 && (
        <span className="ml-1 text-xs text-muted-foreground">+{remaining}</span>
      )}
    </div>
  );
}
