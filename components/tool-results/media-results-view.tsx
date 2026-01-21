"use client";

import { ChevronDownIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { MediaCard, type MediaStatus } from "./media-card";
import type {
  MediaItemShape,
  MediaResultsShape,
  ToolResultProps,
} from "./types";

/**
 * Determine the media type from the item data or tool name hint
 */
function getMediaTypeFromExplicitField(
  item: MediaItemShape
): "movie" | "tv" | null {
  if (item.mediaType) {
    return item.mediaType === "episode"
      ? "tv"
      : (item.mediaType as "movie" | "tv");
  }
  return null;
}

function getMediaTypeFromJellyfinType(
  item: MediaItemShape
): "movie" | "tv" | null {
  if ("type" in item) {
    const itemType = (item as unknown as Record<string, unknown>).type;
    if (itemType === "Episode" || itemType === "Series") {
      return "tv";
    }
    if (itemType === "Movie") {
      return "movie";
    }
  }
  return null;
}

function getMediaTypeFromToolHint(
  item: MediaItemShape,
  toolName?: string
): "movie" | "tv" | null {
  if (!toolName) {
    return null;
  }
  const lower = toolName.toLowerCase();

  if (
    lower.includes("sonarr") ||
    lower.includes("series") ||
    lower.includes("tv")
  ) {
    return "tv";
  }

  if (lower.includes("jellyfin") && "seriesName" in item) {
    return "tv";
  }

  return null;
}

function getMediaType(item: MediaItemShape, toolName?: string): "movie" | "tv" {
  const explicit = getMediaTypeFromExplicitField(item);
  if (explicit) {
    return explicit;
  }

  const jellyfin = getMediaTypeFromJellyfinType(item);
  if (jellyfin) {
    return jellyfin;
  }

  if (
    "tvdbId" in item ||
    "seasonCount" in item ||
    "episodeCount" in item ||
    "seriesName" in item
  ) {
    return "tv";
  }

  const hint = getMediaTypeFromToolHint(item, toolName);
  if (hint) {
    return hint;
  }

  return "movie";
}

/**
 * Get poster URL from various possible field names
 * Handles both standard posterUrl and Jellyfin's imageUrl
 */
function getPosterUrl(item: MediaItemShape): string | null | undefined {
  if (item.posterUrl) {
    return item.posterUrl;
  }

  if (
    "imageUrl" in item &&
    typeof (item as unknown as Record<string, unknown>).imageUrl === "string"
  ) {
    return (item as unknown as Record<string, string>).imageUrl;
  }

  return null;
}

/**
 * Normalize status to MediaStatus enum.
 * Handles various status formats from different services.
 */
function getStatusFromExplicitFlags(item: MediaItemShape): MediaStatus | null {
  if ("isAvailable" in item && item.isAvailable === true) {
    return "available";
  }
  if ("isPending" in item && item.isPending === true) {
    return "pending";
  }
  if ("hasFile" in item && item.hasFile === true) {
    return "available";
  }
  return null;
}

function getStatusFromTextField(item: MediaItemShape): MediaStatus | null {
  if (!item.status) {
    return null;
  }
  const statusLower = item.status.toLowerCase();
  if (statusLower.includes("available") || statusLower.includes("downloaded")) {
    return "available";
  }
  if (statusLower.includes("request")) {
    return "requested";
  }
  if (statusLower.includes("pending") || statusLower.includes("process")) {
    return "pending";
  }
  return null;
}

function normalizeStatus(
  item: MediaItemShape,
  _toolName?: string
): MediaStatus {
  const explicitStatus = getStatusFromExplicitFlags(item);
  if (explicitStatus) {
    return explicitStatus;
  }

  const textStatus = getStatusFromTextField(item);
  if (textStatus) {
    return textStatus;
  }

  if ("imageUrl" in item || "type" in item) {
    return "available";
  }

  if (item.monitored !== undefined) {
    return "hasFile" in item && item.hasFile === false
      ? "unavailable"
      : "available";
  }

  return "unavailable";
}

/**
 * Get rating from various possible sources
 */
function getRating(item: MediaItemShape): number | undefined {
  if (typeof item.rating === "number") {
    return item.rating;
  }

  if (
    "voteAverage" in item &&
    typeof (item as unknown as Record<string, unknown>).voteAverage === "number"
  ) {
    return (item as unknown as Record<string, number>).voteAverage;
  }

  if ("ratings" in item && item.ratings && typeof item.ratings === "object") {
    const ratings = item.ratings as Record<
      string,
      { value?: number } | number | undefined
    >;
    const tmdb = ratings.tmdb;
    const imdb = ratings.imdb;

    if (tmdb && typeof tmdb === "object" && typeof tmdb.value === "number") {
      return tmdb.value;
    }
    if (imdb && typeof imdb === "object" && typeof imdb.value === "number") {
      return imdb.value;
    }
    if (typeof tmdb === "number") {
      return tmdb;
    }
    if (typeof imdb === "number") {
      return imdb;
    }
  }

  return undefined;
}

export type LayoutMode = "auto" | "carousel" | "grid";

const INITIAL_DISPLAY_COUNT = 10;
const PAGE_SIZE = 10;

function getTmdbId(item: MediaItemShape): number | undefined {
  if (typeof item.tmdbId === "number") {
    return item.tmdbId;
  }
  if (typeof item.id === "number" && !("type" in item)) {
    return item.id;
  }
  return undefined;
}

function getImdbId(item: MediaItemShape): string | undefined {
  if (typeof item.imdbId === "string" && item.imdbId.startsWith("tt")) {
    return item.imdbId;
  }
  return undefined;
}

function getJellyfinId(item: MediaItemShape): string | undefined {
  if (typeof item.id === "string" && ("type" in item || "imageUrl" in item)) {
    return item.id;
  }
  return undefined;
}

interface MediaResultsViewProps extends ToolResultProps<MediaResultsShape> {
  toolName?: string;
  layout?: LayoutMode;
  gridThreshold?: number;
  initialCount?: number;
  jellyfinBaseUrl?: string;
}

export function MediaResultsView({
  output,
  toolName,
  layout = "auto",
  gridThreshold = 6,
  initialCount = INITIAL_DISPLAY_COUNT,
  jellyfinBaseUrl,
}: MediaResultsViewProps) {
  const [requestingIds, setRequestingIds] = useState<Set<number>>(new Set());
  const [displayCount, setDisplayCount] = useState(initialCount);

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

  const { visibleResults, hasMore, remaining, message } = useMemo(() => {
    if (!output || !output.results || output.results.length === 0) {
      return {
        visibleResults: [],
        hasMore: false,
        remaining: 0,
        message: output?.message || "No results found.",
      };
    }

    const all = output.results;
    const visible = all.slice(0, displayCount);
    const more = all.length > displayCount;
    const rem = all.length - displayCount;

    return {
      visibleResults: visible,
      hasMore: more,
      remaining: rem,
      message: output.message,
    };
  }, [output, displayCount]);

  const handleLoadMore = useCallback(() => {
    setDisplayCount((prev) => prev + PAGE_SIZE);
  }, []);

  if (!output || !output.results || output.results.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        {output?.message || "No results found."}
      </div>
    );
  }

  const allResultsCount = output.results.length;
  const totalCount =
    output.totalResults ??
    output.totalMatching ??
    output.totalInLibrary ??
    allResultsCount;

  const effectiveLayout =
    layout === "auto"
      ? visibleResults.length <= gridThreshold
        ? "carousel"
        : "grid"
      : layout;

  const renderCard = (item: MediaItemShape, index: number) => {
    const mediaType = getMediaType(item, toolName);
    const tmdbId = getTmdbId(item);

    return (
      <MediaCard
        imdbId={getImdbId(item)}
        jellyfinBaseUrl={jellyfinBaseUrl}
        jellyfinId={getJellyfinId(item)}
        key={item.id ?? index}
        mediaType={mediaType}
        onRequest={handleRequest}
        posterUrl={getPosterUrl(item)}
        rating={getRating(item)}
        status={normalizeStatus(item, toolName)}
        title={item.title}
        tmdbId={tmdbId}
        year={item.year}
      />
    );
  };

  return (
    <div className="space-y-3">
      {message && <p className="text-xs text-muted-foreground">{message}</p>}

      {effectiveLayout === "carousel" ? (
        <div className="px-12">
          <Carousel
            className="w-full"
            opts={{
              align: "start",
              slidesToScroll: 2,
            }}
          >
            <CarouselContent className="-ml-3">
              {visibleResults.map((item, index) => (
                <CarouselItem
                  className="basis-auto pl-3"
                  key={item.id ?? index}
                >
                  {renderCard(item, index)}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </Carousel>
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-3",
            "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          )}
        >
          {visibleResults.map((item, index) => renderCard(item, index))}
        </div>
      )}

      {hasMore ? (
        <div className="flex flex-col items-center gap-2">
          <Button
            className="w-full max-w-xs"
            onClick={handleLoadMore}
            size="sm"
            variant="ghost"
          >
            <ChevronDownIcon className="size-4 mr-1" />
            Load {Math.min(PAGE_SIZE, remaining)} more ({remaining} remaining)
          </Button>
        </div>
      ) : totalCount > allResultsCount ? (
        <p className="text-xs text-muted-foreground text-center">
          Showing all {allResultsCount} of {totalCount} results
        </p>
      ) : null}
    </div>
  );
}
