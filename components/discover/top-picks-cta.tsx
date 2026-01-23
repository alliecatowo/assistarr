"use client";

import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LoaderIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  SparklesIcon,
  StarIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalImage } from "@/components/ui/external-image";
import { Skeleton } from "@/components/ui/skeleton";
import { useFIFOCache } from "@/hooks/use-fifo-cache";
import { cn, getBackdropUrl, getPosterUrl } from "@/lib/utils";
import { useDiscover } from "./discover-context";

// Cache configuration
const CACHE_KEY = "assistarr_top_picks_fifo";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const ITEMS_TO_FETCH = 6; // Fetch 6 items for carousel

// =============================================================================
// Type Definitions
// =============================================================================

interface TopPickItem {
  id: number;
  title: string;
  year?: number;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating?: number;
  mediaType: "movie" | "tv";
  tmdbId: number;
  status: "available" | "requested" | "pending" | "unavailable";
  pitch: string;
  overview?: string;
  genres?: string[];
}

interface TopPicksResponse {
  picks: TopPickItem[];
  message?: string;
}

// =============================================================================
// Loading Skeleton
// =============================================================================

// Card width for carousel calculations
const CARD_WIDTH = 350; // px
const CARD_GAP = 16; // px (gap-4)

function TopPickCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-xl border bg-card shadow-lg h-[420px] flex flex-col shrink-0"
      style={{ width: CARD_WIDTH }}
    >
      {/* Image skeleton */}
      <Skeleton className="aspect-[16/9] w-full shrink-0" />
      {/* Content skeleton */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="space-y-1.5 min-h-[60px]">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-3.5 w-1/2" />
        </div>
        <div className="space-y-1.5 mt-3 flex-1 min-h-[100px] max-h-[120px]">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
        <div className="flex gap-2 pt-3 mt-auto">
          <Skeleton className="h-9 flex-1" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Top Pick Card Component
// =============================================================================

interface TopPickCardProps {
  pick: TopPickItem;
  onRequest: (tmdbId: number, mediaType: "movie" | "tv") => void;
  isRequesting: boolean;
}

function TopPickCard({ pick, onRequest, isRequesting }: TopPickCardProps) {
  const { expandItem } = useDiscover();
  const canRequest = pick.status === "unavailable" && pick.tmdbId;

  const backdropUrl = getBackdropUrl(pick.backdropUrl);
  const posterUrl = getPosterUrl(pick.posterUrl);

  const handleCardClick = () => {
    if (pick.tmdbId) {
      expandItem(pick);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const handleRequestClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    pick.tmdbId && onRequest(pick.tmdbId, pick.mediaType);
  };

  const renderActionButtons = () => {
    if (canRequest) {
      return (
        <Button
          className="flex-1 h-9 text-sm font-medium"
          disabled={isRequesting}
          onClick={handleRequestClick}
          size="sm"
        >
          {isRequesting ? (
            <LoaderIcon className="size-3.5 animate-spin" />
          ) : (
            <>
              <PlusIcon className="size-3.5 mr-1.5" />
              Request
            </>
          )}
        </Button>
      );
    }
    if (pick.status === "available") {
      return (
        <Button
          className="flex-1 h-9 text-sm font-medium"
          onClick={(e) => e.stopPropagation()}
          size="sm"
          variant="secondary"
        >
          <PlayIcon className="size-3.5 mr-1.5" />
          Watch
        </Button>
      );
    }
    if (pick.status === "requested") {
      return (
        <div className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm font-medium">
          <CheckCircleIcon className="size-3.5" />
          <span>Requested</span>
        </div>
      );
    }
    if (pick.status === "pending") {
      return (
        <div className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-md bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-sm font-medium">
          <LoaderIcon className="size-3.5" />
          <span>Pending</span>
        </div>
      );
    }
    return null;
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: Cannot use button element due to nested Button components inside
    <div
      className={cn(
        "group overflow-hidden rounded-xl border bg-card shadow-lg text-left cursor-pointer shrink-0",
        "transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:border-primary/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "h-[420px] flex flex-col"
      )}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      style={{ width: CARD_WIDTH }}
      tabIndex={0}
    >
      {/* Image section with hover darkening */}
      <CardImage
        backdropUrl={backdropUrl}
        posterUrl={posterUrl}
        title={pick.title}
      />
      {/* Content section below image */}
      <CardContent pick={pick}>{renderActionButtons()}</CardContent>
    </div>
  );
}

interface CardImageProps {
  posterUrl: string | null;
  backdropUrl: string | null;
  title: string;
}

function CardImage({ posterUrl, backdropUrl, title }: CardImageProps) {
  // Prefer backdrop for the split card layout (wider aspect ratio)
  const imageUrl = backdropUrl || posterUrl;

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
      {imageUrl ? (
        <ExternalImage
          alt={title}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          src={imageUrl}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          No Image
        </div>
      )}
      {/* Hover overlay to darken image for better contrast */}
      <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/30" />
    </div>
  );
}

interface CardContentProps {
  pick: TopPickItem;
  children: React.ReactNode;
}

function CardContent({ pick, children }: CardContentProps) {
  return (
    <div className="p-4 flex-1 flex flex-col">
      {/* Title and meta row */}
      <div className="space-y-1.5 min-h-[60px]">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold line-clamp-2 leading-tight">
            {pick.title}
            {pick.year && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                ({pick.year})
              </span>
            )}
          </h3>
          {pick.rating && pick.rating > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <StarIcon className="size-3.5 fill-yellow-500 text-yellow-500" />
              <span className="text-sm font-medium">
                {pick.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="capitalize">
            {pick.mediaType === "tv" ? "TV Series" : "Movie"}
          </span>
          {pick.genres && pick.genres.length > 0 && (
            <span className="truncate">
              {pick.genres.slice(0, 2).join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* AI Pitch - the main attraction with constrained height */}
      <div className="flex gap-2 mt-3 flex-1 min-h-[100px] max-h-[120px] overflow-hidden">
        <SparklesIcon className="size-4 shrink-0 mt-0.5 text-primary" />
        <div className="relative flex-1">
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-5">
            {pick.pitch}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent" />
        </div>
      </div>

      {/* Action buttons - anchored to bottom */}
      <div className="flex gap-2 pt-3 mt-auto">{children}</div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

// Fetch function for cache
async function fetchTopPicksData(): Promise<TopPickItem[]> {
  const response = await fetch(
    `/api/discover/top-picks?count=${ITEMS_TO_FETCH}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch top picks");
  }
  const data: TopPicksResponse = await response.json();
  return data.picks;
}

export function TopPicksCta() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [requestingId, setRequestingId] = useState<number | null>(null);
  const { updateItemStatus } = useDiscover();

  // Use deduplicated cache for top picks (6 unique items)
  const {
    items: picks,
    isLoading,
    error,
    refresh,
  } = useFIFOCache<TopPickItem>(CACHE_KEY, fetchTopPicksData, {
    ttlMs: CACHE_TTL_MS,
    maxItems: 6,
    progressiveLoad: false, // Fetch all 6 at once
    autoRefresh: true,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Create infinite loop by tripling items (prev + current + next)
  const loopedPicks = useMemo(() => {
    if (picks.length < 4) {
      return picks;
    }
    return [...picks, ...picks, ...picks];
  }, [picks]);

  // Check if carousel is scrollable
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
    if (!el || picks.length < 4) {
      return;
    }

    // Start at the middle set
    const cardFullWidth = CARD_WIDTH + CARD_GAP;
    const middleStart = cardFullWidth * picks.length;
    el.scrollLeft = middleStart;

    checkScrollability();
    window.addEventListener("resize", checkScrollability);

    // Handle scroll end to create seamless loop
    const handleScrollEnd = () => {
      const setWidth = cardFullWidth * picks.length;
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
  }, [checkScrollability, picks.length]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    // Scroll by approximately 3 cards
    const scrollAmount = (CARD_WIDTH + CARD_GAP) * 3;

    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRequest = async (tmdbId: number, mediaType: "movie" | "tv") => {
    setRequestingId(tmdbId);

    try {
      const response = await fetch("/api/media/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId, mediaType }),
      });

      if (!response.ok) {
        throw new Error("Failed to request media");
      }

      updateItemStatus(tmdbId, "requested");
    } catch {
      // Request failed silently
    } finally {
      setRequestingId(null);
    }
  };

  // Loading state (only show on initial load, not during refresh)
  if (isLoading && picks.length === 0) {
    return (
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <SparklesIcon className="size-5 text-primary" />
          <h2 className="text-xl font-bold">Top Picks For You</h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          <TopPickCardSkeleton />
          <TopPickCardSkeleton />
          <TopPickCardSkeleton />
        </div>
      </section>
    );
  }

  // Error state
  if (error && picks.length === 0) {
    return null; // Silently fail - not critical
  }

  // Empty state
  if (picks.length === 0) {
    return null; // Don't show section if no picks
  }

  // Use looped items for infinite scroll, or original if too few
  const displayPicks = picks.length >= 4 ? loopedPicks : picks;

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <SparklesIcon className="size-5 text-primary" />
        <div className="flex-1">
          <h2 className="text-xl font-bold">Top Picks For You</h2>
          <p className="text-xs text-muted-foreground">
            Deeply analyzed matches based on your taste
          </p>
        </div>
        <Button
          disabled={isRefreshing}
          onClick={handleRefresh}
          size="sm"
          variant="ghost"
        >
          <RefreshCwIcon
            className={cn("size-4", isRefreshing && "animate-spin")}
          />
          <span className="ml-1.5 hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Carousel */}
      <div className="group/carousel relative">
        {/* Left arrow - always visible on hover for infinite carousel */}
        {canScroll && (
          <Button
            aria-label="Scroll left"
            className={cn(
              "absolute left-2 top-1/2 z-10 -translate-y-1/2",
              "size-10 rounded-full",
              "bg-background/80 backdrop-blur-sm shadow-lg border",
              "opacity-0 transition-all duration-200",
              "group-hover/carousel:opacity-100",
              "hover:bg-background/95"
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
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-none"
          ref={scrollRef}
        >
          {displayPicks.map((pick, index) => (
            <TopPickCard
              isRequesting={requestingId === pick.tmdbId}
              key={`${pick.id}-${index}`}
              onRequest={handleRequest}
              pick={pick}
            />
          ))}
        </div>

        {/* Right arrow - always visible on hover for infinite carousel */}
        {canScroll && (
          <Button
            aria-label="Scroll right"
            className={cn(
              "absolute right-2 top-1/2 z-10 -translate-y-1/2",
              "size-10 rounded-full",
              "bg-background/80 backdrop-blur-sm shadow-lg border",
              "opacity-0 transition-all duration-200",
              "group-hover/carousel:opacity-100",
              "hover:bg-background/95"
            )}
            onClick={() => scroll("right")}
            size="icon"
            variant="ghost"
          >
            <ChevronRightIcon className="size-5" />
          </Button>
        )}
      </div>
    </section>
  );
}
