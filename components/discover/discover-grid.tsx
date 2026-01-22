"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getPosterUrl } from "@/lib/utils";
import { DiscoverCard } from "./discover-card";
import { type DiscoverItem, useDiscover } from "./discover-context";
import { DiscoverRow } from "./discover-row";

interface DiscoverGridProps {
  items: DiscoverItem[];
  showReasons?: boolean;
  horizontal?: boolean;
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

    // Fetch missing posters in parallel
    const fetchPosters = async () => {
      const posterMap = new Map<number, string>();

      await Promise.all(
        itemsNeedingPoster.map(async (item) => {
          if (!item.tmdbId) return;
          try {
            const response = await fetch(
              `/api/media/lookup?type=${item.mediaType}&id=${item.tmdbId}&source=jellyseerr`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.posterUrl) {
                posterMap.set(item.tmdbId, data.posterUrl);
              }
            }
          } catch {
            // Ignore fetch errors
          }
        })
      );

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
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
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
