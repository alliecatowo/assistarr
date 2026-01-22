/* eslint-disable a11y/useSemanticElements */
"use client";

import {
  CheckCircleIcon,
  LoaderIcon,
  PlayIcon,
  PlusIcon,
  SparklesIcon,
  StarIcon,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDiscover } from "./discover-context";

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
  pitch: string; // Personalized "why you'll love it" pitch
  genres?: string[];
}

interface TopPicksResponse {
  picks: TopPickItem[];
  message?: string;
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function TopPickCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card shadow-lg">
      <Skeleton className="aspect-[2/3] w-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-8" />
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

  const backdropUrl = pick.backdropUrl?.startsWith("/")
    ? `https://image.tmdb.org/t/p/w1280${pick.backdropUrl}`
    : pick.backdropUrl;

  const posterUrl = pick.posterUrl?.startsWith("/")
    ? `https://image.tmdb.org/t/p/w342${pick.posterUrl}`
    : pick.posterUrl;

  const handleCardClick = () => {
    if (pick.tmdbId) {
      expandItem(pick);
    }
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card shadow-lg text-left cursor-pointer",
        "transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:border-primary/50"
      )}
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
      role="button"
      tabIndex={0}
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
        {posterUrl || backdropUrl ? (
          <Image
            alt={pick.title}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            fill
            priority
            sizes="(max-width: 768px) 50vw, 33vw"
            src={posterUrl || backdropUrl || ""}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}

        {/* Gradient Overlay - stronger at bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
        {/* Title - more prominent */}
        <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight">
          {pick.title}
          {pick.year && (
            <span className="text-sm font-normal text-white/80 ml-1">
              ({pick.year})
            </span>
          )}
        </h3>

        {/* Rating & Type - condensed */}
        <div className="flex items-center gap-2 text-xs text-white/90">
          {pick.rating && pick.rating > 0 && (
            <div className="flex items-center gap-1">
              <StarIcon className="size-3 fill-yellow-500 text-yellow-500" />
              <span className="font-medium">{pick.rating.toFixed(1)}</span>
            </div>
          )}
          <span className="capitalize">
            {pick.mediaType === "tv" ? "TV" : "Movie"}
          </span>
          {pick.genres && pick.genres.length > 0 && (
            <span className="text-white/60 truncate">
              • {pick.genres.slice(0, 2).join(", ")}
            </span>
          )}
        </div>

        {/* Personalized Pitch - more subtle */}
        <p className="text-xs text-white/80 line-clamp-2 leading-snug">
          {pick.pitch}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          {canRequest && (
            <Button
              className="flex-1 h-8 text-sm font-medium"
              disabled={isRequesting}
              onClick={(e) => {
                e.stopPropagation();
                pick.tmdbId && onRequest(pick.tmdbId, pick.mediaType);
              }}
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
          )}
          {pick.status === "available" && (
            <Button
              className="flex-1 h-8 text-sm font-medium"
              onClick={(e) => e.stopPropagation()}
              size="sm"
              variant="secondary"
            >
              <PlayIcon className="size-3.5 mr-1.5" />
              Watch
            </Button>
          )}
          {pick.status === "requested" && (
            <div className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-medium">
              <CheckCircleIcon className="size-3" />
              <span>Requested</span>
            </div>
          )}
          {pick.status === "pending" && (
            <div className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-md bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-medium">
              <LoaderIcon className="size-3" />
              <span>Pending</span>
            </div>
          )}

          {/* More Info Button (always shown) */}
          <Button
            className="h-8 px-3"
            onClick={handleCardClick}
            size="sm"
            variant="outline"
          >
            <span className="text-xs">Info</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function TopPicksCta() {
  const [picks, setPicks] = useState<TopPickItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestingId, setRequestingId] = useState<number | null>(null);
  const { updateItemStatus } = useDiscover();

  useEffect(() => {
    async function fetchTopPicks() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/discover/top-picks");
        if (!response.ok) {
          throw new Error("Failed to fetch top picks");
        }

        const data: TopPicksResponse = await response.json();
        setPicks(data.picks);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchTopPicks();
  }, []);

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

  // Loading state
  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <SparklesIcon className="size-5 text-primary" />
          <h2 className="text-xl font-bold">Top Picks For You</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <TopPickCardSkeleton />
          <TopPickCardSkeleton />
          <TopPickCardSkeleton />
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return null; // Silently fail - not critical
  }

  // Empty state
  if (picks.length === 0) {
    return null; // Don't show section if no picks
  }

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <SparklesIcon className="size-5 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Top Picks For You</h2>
          <p className="text-xs text-muted-foreground">
            Deeply analyzed matches based on your taste
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {picks.map((pick) => (
          <TopPickCard
            isRequesting={requestingId === pick.tmdbId}
            key={pick.id}
            onRequest={handleRequest}
            pick={pick}
          />
        ))}
      </div>
    </section>
  );
}
