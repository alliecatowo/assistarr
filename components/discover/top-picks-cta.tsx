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
      <Skeleton className="aspect-[16/9] w-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
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
        "group relative overflow-hidden rounded-xl border bg-card shadow-lg",
        "transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:border-primary/50",
        "cursor-pointer"
      )}
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
      role="button"
      tabIndex={0}
    >
      {/* Backdrop Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {backdropUrl || posterUrl ? (
          <Image
            alt={pick.title}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            src={backdropUrl || posterUrl || ""}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      </div>

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
        {/* Title & Year */}
        <div>
          <h3 className="text-2xl font-bold text-white line-clamp-2">
            {pick.title}
          </h3>
          <div className="flex items-center gap-3 mt-2 text-sm text-white/90">
            {pick.year && <span>{pick.year}</span>}
            {pick.rating && pick.rating > 0 && (
              <div className="flex items-center gap-1">
                <StarIcon className="size-4 fill-yellow-500 text-yellow-500" />
                <span>{pick.rating.toFixed(1)}</span>
              </div>
            )}
            <span className="capitalize">
              {pick.mediaType === "tv" ? "TV Series" : "Movie"}
            </span>
          </div>
        </div>

        {/* Genres */}
        {pick.genres && pick.genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pick.genres.slice(0, 3).map((genre) => (
              <span
                className="text-xs px-2 py-1 rounded-full bg-white/20 text-white"
                key={genre}
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Personalized Pitch */}
        <p className="text-sm text-white/90 line-clamp-3 leading-relaxed">
          {pick.pitch}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {canRequest && (
            <Button
              className="flex-1 h-11 font-semibold"
              disabled={isRequesting}
              onClick={(e) => {
                e.stopPropagation();
                pick.tmdbId && onRequest(pick.tmdbId, pick.mediaType);
              }}
              size="lg"
            >
              {isRequesting ? (
                <LoaderIcon className="size-5 animate-spin" />
              ) : (
                <>
                  <PlusIcon className="size-5 mr-2" />
                  Request Now
                </>
              )}
            </Button>
          )}
          {pick.status === "available" && (
            <Button
              className="flex-1 h-11 font-semibold"
              onClick={(e) => e.stopPropagation()}
              size="lg"
              variant="secondary"
            >
              <PlayIcon className="size-5 mr-2" />
              Watch Now
            </Button>
          )}
          {pick.status === "requested" && (
            <div className="flex-1 h-11 flex items-center justify-center gap-2 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <CheckCircleIcon className="size-5" />
              <span className="font-medium">Requested</span>
            </div>
          )}
          {pick.status === "pending" && (
            <div className="flex-1 h-11 flex items-center justify-center gap-2 rounded-md bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              <LoaderIcon className="size-5" />
              <span className="font-medium">Pending</span>
            </div>
          )}

          {/* More Info Button (always shown) */}
          <Button
            className="h-11 px-4"
            onClick={handleCardClick}
            size="lg"
            variant="outline"
          >
            <span className="text-sm">More Info</span>
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
    } catch (e) {
      console.error("Request failed:", e);
    } finally {
      setRequestingId(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <section className="mb-10">
        <div className="mb-6 flex items-center gap-2">
          <SparklesIcon className="size-6 text-primary" />
          <h2 className="text-2xl font-bold">Top Picks For You</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
    <section className="mb-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <SparklesIcon className="size-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Top Picks For You</h2>
          <p className="text-sm text-muted-foreground">
            Deeply analyzed matches based on your taste
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
