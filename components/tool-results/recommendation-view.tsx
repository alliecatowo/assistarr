"use client";

import { Loader2Icon, PlusIcon } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  RecommendationItem,
  RecommendationShape,
  ToolState,
} from "./types";
import { TMDB_POSTER_W185 } from "./types";

interface RecommendationViewProps {
  output: RecommendationShape;
  state: ToolState;
}

/**
 * Renders recommendations as rich cards with reasons.
 *
 * Each recommendation shows:
 * - Poster thumbnail
 * - Title and year
 * - Rating badge
 * - Reason text explaining the recommendation
 * - Request button
 */
export function RecommendationView({ output }: RecommendationViewProps) {
  const [requestingIds, setRequestingIds] = useState<Set<number>>(new Set());

  const handleRequest = useCallback(
    async (tmdbId: number, mediaType: "movie" | "tv") => {
      if (requestingIds.has(tmdbId)) {
        return;
      }

      setRequestingIds((prev) => new Set(prev).add(tmdbId));

      try {
        const response = await fetch("/api/media/request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tmdbId, mediaType }),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || "Failed to request media");
          return;
        }

        toast.success(data.message || "Media requested successfully");
      } catch (_error) {
        toast.error("Failed to request media");
      } finally {
        setRequestingIds((prev) => {
          const next = new Set(prev);
          next.delete(tmdbId);
          return next;
        });
      }
    },
    [requestingIds]
  );

  if (!output.recommendations || output.recommendations.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        No recommendations available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {output.introduction && (
        <p className="text-sm text-muted-foreground">{output.introduction}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
        {output.recommendations.map((rec: RecommendationItem) => (
          <RecommendationCard
            isRequesting={requestingIds.has(rec.tmdbId)}
            key={rec.tmdbId}
            onRequest={handleRequest}
            recommendation={rec}
          />
        ))}
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  recommendation: RecommendationItem;
  onRequest: (tmdbId: number, mediaType: "movie" | "tv") => void;
  isRequesting: boolean;
}

/**
 * Individual recommendation card with poster, title, reason, and action buttons.
 */
function RecommendationCard({
  recommendation,
  onRequest,
  isRequesting,
}: RecommendationCardProps) {
  const { title, year, tmdbId, mediaType, rating, reason, genres, posterUrl } =
    recommendation;

  // Build full poster URL for TMDB paths
  const fullPosterUrl = posterUrl
    ? posterUrl.startsWith("/")
      ? `${TMDB_POSTER_W185}${posterUrl}`
      : posterUrl
    : null;

  return (
    <div className="flex gap-3 p-3 rounded-lg border bg-card hover:border-primary/30 transition-colors">
      {/* Poster thumbnail */}
      <div className="relative flex-shrink-0 w-[80px] aspect-[2/3] rounded overflow-hidden bg-muted">
        {fullPosterUrl ? (
          <Image
            alt={`${title} poster`}
            className="object-cover"
            fill
            sizes="80px"
            src={fullPosterUrl}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <span className="text-[10px]">No Image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 min-w-0 gap-1">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="font-medium text-sm leading-tight">
              <span className="line-clamp-1">{title}</span>
              {year && (
                <span className="text-muted-foreground ml-1">({year})</span>
              )}
            </h4>
            {genres && genres.length > 0 && (
              <p className="text-xs text-muted-foreground truncate">
                {genres.slice(0, 3).join(", ")}
              </p>
            )}
          </div>

          {/* Rating badge */}
          {rating !== undefined && (
            <Badge
              className={cn(
                "flex-shrink-0 text-xs",
                rating >= 7
                  ? "bg-green-500/20 text-green-700 dark:text-green-400"
                  : rating >= 5
                    ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                    : "bg-red-500/20 text-red-700 dark:text-red-400"
              )}
              variant="secondary"
            >
              {rating.toFixed(1)}
            </Badge>
          )}
        </div>

        {/* Reason - the key differentiator from regular media cards */}
        <p className="text-xs text-muted-foreground line-clamp-2">{reason}</p>

        {/* Footer with type and request button */}
        <div className="mt-auto pt-1 flex items-center justify-between gap-2">
          <Badge className="text-[10px]" variant="outline">
            {mediaType === "tv" ? "TV Show" : "Movie"}
          </Badge>

          <Button
            className="h-6 px-2 text-[10px]"
            disabled={isRequesting}
            onClick={() => onRequest(tmdbId, mediaType)}
            size="sm"
            variant="secondary"
          >
            {isRequesting ? (
              <Loader2Icon className="size-3 animate-spin" />
            ) : (
              <PlusIcon className="size-3" />
            )}
            Request
          </Button>
        </div>
      </div>
    </div>
  );
}
