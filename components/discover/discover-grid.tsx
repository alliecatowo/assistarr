"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
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
  const { updateItemStatus } = useDiscover();

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

  if (items.length === 0) {
    return null;
  }

  // Horizontal Netflix-style row
  if (horizontal) {
    return <DiscoverRow items={items} showReasons={showReasons} />;
  }

  // Grid mode (for AI results with reasons)
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item, index) => (
        <DiscoverCard
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
