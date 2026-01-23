"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DiscoverCard } from "./discover-card";
import { type DiscoverItem, useDiscover } from "./discover-context";

interface DiscoverRowProps {
  items: DiscoverItem[];
  showReasons?: boolean;
}

export function DiscoverRow({ items, showReasons = false }: DiscoverRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [requestingIds, setRequestingIds] = useState<Set<number>>(new Set());
  const { updateItemStatus } = useDiscover();

  // Create infinite loop by tripling items (prev + current + next)
  const loopedItems = useMemo(() => {
    if (items.length < 4) {
      return items;
    }
    return [...items, ...items, ...items];
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

  const checkScrollability = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    setCanScroll(el.scrollWidth > el.clientWidth);
  }, []);

  // Set initial scroll position to middle set and handle infinite loop
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || items.length < 4) {
      return;
    }

    // Start at the middle set (index = items.length)
    const cardWidth = 172;
    const middleStart = cardWidth * items.length;
    el.scrollLeft = middleStart;

    checkScrollability();
    window.addEventListener("resize", checkScrollability);

    // Handle scroll end to create seamless loop
    const handleScrollEnd = () => {
      const setWidth = cardWidth * items.length;
      const currentScroll = el.scrollLeft;

      // If scrolled to first set, jump to middle
      if (currentScroll < setWidth * 0.5) {
        el.scrollLeft = currentScroll + setWidth;
      }
      // If scrolled to third set, jump to middle
      else if (currentScroll > setWidth * 2.5) {
        el.scrollLeft = currentScroll - setWidth;
      }
    };

    el.addEventListener("scrollend", handleScrollEnd);

    return () => {
      window.removeEventListener("resize", checkScrollability);
      el.removeEventListener("scrollend", handleScrollEnd);
    };
  }, [checkScrollability, items.length]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    const cardWidth = 172;
    const scrollAmount = cardWidth * 3;

    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, []);

  if (items.length === 0) {
    return null;
  }

  const displayItems = items.length >= 4 ? loopedItems : items;

  return (
    <div className="group/row relative">
      {/* Left scroll button - always visible on hover when scrollable */}
      {canScroll && (
        <Button
          aria-label="Scroll left"
          className={cn(
            "absolute left-2 top-1/2 z-10 -translate-y-1/2",
            "size-9 rounded-full",
            "bg-background/70 backdrop-blur-sm shadow-lg border",
            "opacity-0 transition-all duration-200",
            "group-hover/row:opacity-100",
            "hover:bg-background/90"
          )}
          onClick={() => scroll("left")}
          size="icon"
          variant="ghost"
        >
          <ChevronLeftIcon className="size-5" />
        </Button>
      )}

      {/* Scrollable container */}
      <div
        className={cn("flex gap-3 overflow-x-auto pb-2", "scrollbar-none")}
        ref={scrollRef}
      >
        {displayItems.map((item, index) => (
          <div className="shrink-0" key={`${item.id}-${index}`}>
            <DiscoverCard
              isRequesting={requestingIds.has(item.tmdbId ?? 0)}
              item={item}
              onRequest={handleRequest}
              showReason={showReasons}
            />
          </div>
        ))}
      </div>

      {/* Right scroll button - always visible on hover when scrollable */}
      {canScroll && (
        <Button
          aria-label="Scroll right"
          className={cn(
            "absolute right-2 top-1/2 z-10 -translate-y-1/2",
            "size-9 rounded-full",
            "bg-background/70 backdrop-blur-sm shadow-lg border",
            "opacity-0 transition-all duration-200",
            "group-hover/row:opacity-100",
            "hover:bg-background/90"
          )}
          onClick={() => scroll("right")}
          size="icon"
          variant="ghost"
        >
          <ChevronRightIcon className="size-5" />
        </Button>
      )}
    </div>
  );
}
