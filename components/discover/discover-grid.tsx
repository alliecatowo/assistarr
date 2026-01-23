"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DiscoverCard } from "./discover-card";
import { type DiscoverItem, useDiscover } from "./discover-context";
import { DiscoverRow } from "./discover-row";

interface DiscoverGridProps {
  items: DiscoverItem[];
  showReasons?: boolean;
  horizontal?: boolean;
}

/**
 * Fetches a poster URL for a single item from the media lookup API.
 * Returns an object with tmdbId and posterUrl if successful, null otherwise.
 */
async function fetchPosterForItem(
  item: DiscoverItem
): Promise<{ tmdbId: number; posterUrl: string } | null> {
  if (!item.tmdbId) {
    return null;
  }
  try {
    const response = await fetch(
      `/api/media/lookup?type=${item.mediaType}&id=${item.tmdbId}&source=jellyseerr`
    );
    if (response.ok) {
      const data = await response.json();
      if (data.posterUrl) {
        return { tmdbId: item.tmdbId, posterUrl: data.posterUrl };
      }
    }
  } catch {
    // Ignore fetch errors
  }
  return null;
}

export function DiscoverGrid({
  items,
  showReasons = false,
  horizontal = false,
}: DiscoverGridProps) {
  const [requestingIds, setRequestingIds] = useState<Set<number>>(new Set());
  const [enrichedItems, setEnrichedItems] = useState<DiscoverItem[]>(items);
  const { updateItemStatus } = useDiscover();

  // Fetch missing poster URLs for items that have tmdbId but no posterUrl
  useEffect(() => {
    const itemsNeedingPoster = items.filter(
      (item) => !item.posterUrl && item.tmdbId
    );

    if (itemsNeedingPoster.length === 0) {
      setEnrichedItems(items);
      return;
    }

    // Start with items as-is, then enrich
    setEnrichedItems(items);

    // Fetch missing posters in parallel - use allSettled for better error tolerance
    const fetchPosters = async () => {
      const results = await Promise.allSettled(
        itemsNeedingPoster.map(fetchPosterForItem)
      );

      // Extract fulfilled results and build a poster map
      const posterMap = new Map<number, string>();
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          posterMap.set(result.value.tmdbId, result.value.posterUrl);
        }
      }

      if (posterMap.size > 0) {
        setEnrichedItems((prev) =>
          prev.map((item) => {
            if (item.tmdbId && posterMap.has(item.tmdbId)) {
              return { ...item, posterUrl: posterMap.get(item.tmdbId) };
            }
            return item;
          })
        );
      }
    };

    fetchPosters();
  }, [items]);

  const handleRequest = useCallback(
    async (tmdbId: number, mediaType: "movie" | "tv") => {
      if (requestingIds.has(tmdbId)) {
        return;
      }

      setRequestingIds((prev) => new Set(prev).add(tmdbId));
      try {
        const response = await fetch("/api/media/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tmdbId, mediaType }),
        });
        const data = await response.json();
        if (!response.ok) {
          toast.error(data.error || "Failed to request");
          return;
        }
        toast.success(`Requested ${data.title || "media"}`);
        // Update item status in context
        updateItemStatus(tmdbId, "requested");
      } catch {
        toast.error("Failed to request");
      } finally {
        setRequestingIds((prev) => {
          const next = new Set(prev);
          next.delete(tmdbId);
          return next;
        });
      }
    },
    [requestingIds, updateItemStatus]
  );

  if (enrichedItems.length === 0) {
    return null;
  }

  // Horizontal Netflix-style row
  if (horizontal) {
    return <DiscoverRow items={enrichedItems} showReasons={showReasons} />;
  }

  // Grid mode (for AI results with reasons)
  // Use larger cards with fewer columns when showing AI recommendations with reasons
  const gridClasses = showReasons
    ? "grid gap-4 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    : "grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7";

  return (
    <div className={gridClasses}>
      {enrichedItems.map((item, index) => (
        <DiscoverCard
          fillContainer
          isRequesting={requestingIds.has(item.tmdbId ?? 0)}
          item={item}
          key={item.id ?? index}
          onRequest={handleRequest}
          showReason={showReasons}
        />
      ))}
    </div>
  );
}
