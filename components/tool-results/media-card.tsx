"use client";

import {
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  ExternalLinkIcon,
  PlayIcon,
  PlusIcon,
  StarIcon,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TMDB_POSTER_W342 } from "./types";

export type MediaStatus = "available" | "requested" | "pending" | "unavailable";

export interface MediaCardProps {
  title: string;
  year?: number;
  posterUrl?: string | null;
  rating?: number;
  mediaType: "movie" | "tv";
  status?: MediaStatus;
  className?: string;
  /** Compact mode for inline/hover cards */
  compact?: boolean;
  /** TMDB ID for requesting media */
  tmdbId?: number;
  /** IMDB ID for linking to IMDB */
  imdbId?: string;
  /** Jellyfin item ID for Watch button */
  jellyfinId?: string;
  /** Jellyfin base URL for constructing watch link */
  jellyfinBaseUrl?: string;
  /** Callback when Request button is clicked */
  onRequest?: (tmdbId: number, mediaType: "movie" | "tv") => void;
}

const STATUS_CONFIG: Record<
  MediaStatus,
  { label: string; icon: typeof CheckCircleIcon; className: string }
> = {
  available: {
    label: "Available",
    icon: CheckCircleIcon,
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  requested: {
    label: "Requested",
    icon: ClockIcon,
    className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  pending: {
    label: "Pending",
    icon: ClockIcon,
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  unavailable: {
    label: "Not Available",
    icon: CircleIcon,
    className: "bg-muted text-muted-foreground border-border",
  },
};

/**
 * Media card for displaying in carousels or grids.
 * Shows poster, title, year, rating, media type, and availability status.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: View logic is complex
export function MediaCard({
  title,
  year,
  posterUrl,
  rating,
  mediaType,
  status = "unavailable",
  className,
  compact = false,
  tmdbId,
  imdbId,
  jellyfinId,
  jellyfinBaseUrl,
  onRequest,
}: MediaCardProps) {
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;

  // Build full poster URL for TMDB paths - use w342 for better quality
  const fullPosterUrl = posterUrl
    ? posterUrl.startsWith("/")
      ? `${TMDB_POSTER_W342}${posterUrl}`
      : posterUrl
    : null;

  const cardWidth = compact ? "w-[120px]" : "w-[170px]";
  const posterSize = compact ? "120px" : "170px";

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm",
        "transition-all duration-200 ease-out",
        "hover:shadow-lg hover:scale-[1.02] hover:border-primary/30",
        cardWidth,
        className
      )}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
        {fullPosterUrl ? (
          <Image
            alt={`${title} poster`}
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            fill
            sizes={posterSize}
            src={fullPosterUrl}
            unoptimized // External URLs need this
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            <span className="text-xs">No Image</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={cn("flex flex-col gap-1.5", compact ? "p-1.5" : "p-2.5")}>
        {/* Title + Year */}
        <div className={compact ? "min-h-[2rem]" : "min-h-[2.75rem]"}>
          <h4
            className={cn(
              "line-clamp-2 font-medium leading-tight",
              compact ? "text-[10px]" : "text-xs"
            )}
          >
            {title}
            {year && <span className="text-muted-foreground"> ({year})</span>}
          </h4>
        </div>

        {/* Rating + Type */}
        <div
          className={cn(
            "flex items-center gap-1.5 text-muted-foreground",
            compact ? "text-[9px]" : "text-[11px]"
          )}
        >
          {rating !== undefined && rating > 0 && (
            <>
              <StarIcon
                className={cn(
                  "fill-yellow-500 text-yellow-500",
                  compact ? "size-2.5" : "size-3"
                )}
              />
              <span>{rating.toFixed(1)}</span>
              <span className="text-border">|</span>
            </>
          )}
          <span className="capitalize">
            {mediaType === "tv" ? "TV" : "Movie"}
          </span>
        </div>

        {/* Status Badge */}
        <div
          className={cn(
            "mt-0.5 flex items-center justify-center gap-1 rounded-full border font-medium",
            compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[10px]",
            statusConfig.className
          )}
        >
          <StatusIcon className={compact ? "size-2.5" : "size-3"} />
          <span>{statusConfig.label}</span>
        </div>

        {/* Action Buttons */}
        {!compact &&
          (jellyfinId || imdbId || (tmdbId && status !== "available")) && (
            <div className="mt-1.5 flex items-center justify-center gap-1">
              {/* Watch Button - only show if jellyfinId is available */}
              {jellyfinId && jellyfinBaseUrl && (
                <Button
                  asChild
                  className="h-6 px-2 text-[10px]"
                  size="sm"
                  variant="ghost"
                >
                  <a
                    href={`${jellyfinBaseUrl}/web/index.html#!/details?id=${jellyfinId}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <PlayIcon className="size-3" />
                    Watch
                  </a>
                </Button>
              )}

              {/* IMDB Button - only show if imdbId is available */}
              {imdbId && (
                <Button
                  asChild
                  className="h-6 px-2 text-[10px]"
                  size="sm"
                  variant="ghost"
                >
                  <a
                    href={`https://www.imdb.com/title/${imdbId}`}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <ExternalLinkIcon className="size-3" />
                    IMDB
                  </a>
                </Button>
              )}

              {/* Request Button - only show if tmdbId is available and not already available */}
              {tmdbId &&
                status !== "available" &&
                status !== "requested" &&
                status !== "pending" &&
                onRequest && (
                  <Button
                    className="h-6 px-2 text-[10px]"
                    onClick={() => onRequest(tmdbId, mediaType)}
                    size="sm"
                    variant="ghost"
                  >
                    <PlusIcon className="size-3" />
                    Request
                  </Button>
                )}
            </div>
          )}
      </div>
    </div>
  );
}
