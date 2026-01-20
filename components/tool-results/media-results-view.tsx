"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
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
function getMediaType(item: MediaItemShape, toolName?: string): "movie" | "tv" {
  // Explicit mediaType field
  if (item.mediaType) {
    return item.mediaType;
  }

  // Jellyfin format: type field with capitalized values ("Movie", "Episode", "Series")
  if ("type" in item) {
    const itemType = (item as any).type;
    if (itemType === "Episode" || itemType === "Series") {
      return "tv";
    }
    if (itemType === "Movie") {
      return "movie";
    }
  }

  // Check for TV-specific fields
  if (
    "tvdbId" in item ||
    "seasonCount" in item ||
    "episodeCount" in item ||
    "seriesName" in item
  ) {
    return "tv";
  }

  // Hint from tool name (for backwards compatibility)
  if (toolName) {
    const lower = toolName.toLowerCase();
    if (
      lower.includes("sonarr") ||
      lower.includes("series") ||
      lower.includes("tv") ||
      lower.includes("jellyfin")
    ) {
      // Jellyfin can be either, but if we're here it's likely episodes
      if (lower.includes("jellyfin") && "seriesName" in item) {
        return "tv";
      }
    }
    if (
      lower.includes("sonarr") ||
      lower.includes("series") ||
      lower.includes("tv")
    ) {
      return "tv";
    }
  }

  // Default to movie
  return "movie";
}

/**
 * Get poster URL from various possible field names
 * Handles both standard posterUrl and Jellyfin's imageUrl
 */
function getPosterUrl(item: MediaItemShape): string | null | undefined {
  // Standard posterUrl field (TMDB, Radarr, Sonarr, Jellyseerr)
  if (item.posterUrl) {
    return item.posterUrl;
  }

  // Jellyfin returns imageUrl instead
  if ("imageUrl" in item && typeof (item as any).imageUrl === "string") {
    return (item as any).imageUrl;
  }

  return null;
}

/**
 * Normalize status to MediaStatus enum.
 * Handles various status formats from different services.
 */
function normalizeStatus(
  item: MediaItemShape,
  _toolName?: string
): MediaStatus {
  // Jellyseerr format: explicit boolean flags
  if ("isAvailable" in item && item.isAvailable === true) {
    return "available";
  }
  if ("isPending" in item && item.isPending === true) {
    return "pending";
  }

  // Library format: hasFile indicates downloaded/available
  if ("hasFile" in item && item.hasFile === true) {
    return "available";
  }

  // Check string status field
  if (item.status) {
    const statusLower = item.status.toLowerCase();
    if (
      statusLower.includes("available") ||
      statusLower.includes("downloaded")
    ) {
      return "available";
    }
    if (statusLower.includes("request")) {
      return "requested";
    }
    if (statusLower.includes("pending") || statusLower.includes("process")) {
      return "pending";
    }
  }

  // Jellyfin items from library are already available (they exist in the library)
  // Items with imageUrl are from Jellyfin library
  if ("imageUrl" in item || "type" in item) {
    return "available";
  }

  // Radarr/Sonarr library items - if monitored and has a quality profile, likely available
  if (item.monitored !== undefined) {
    // If it's in the library and monitored, default to available unless hasFile is explicitly false
    if ("hasFile" in item && item.hasFile === false) {
      return "unavailable";
    }
    return "available";
  }

  return "unavailable";
}

/**
 * Get rating from various possible sources
 */
function getRating(item: MediaItemShape): number | undefined {
  // Direct rating field
  if (typeof item.rating === "number") {
    return item.rating;
  }

  // Jellyseerr format
  if ("voteAverage" in item && typeof (item as any).voteAverage === "number") {
    return (item as any).voteAverage;
  }

  // Radarr format
  if ("ratings" in item && typeof item === "object") {
    const ratings = (item as any).ratings;
    if (ratings?.tmdb?.value) {
      return ratings.tmdb.value;
    }
    if (ratings?.imdb?.value) {
      return ratings.imdb.value;
    }
    if (ratings?.tmdb) {
      return ratings.tmdb;
    }
    if (ratings?.imdb) {
      return ratings.imdb;
    }
  }

  return undefined;
}

export type LayoutMode = "auto" | "carousel" | "grid";

/** Default max items to display */
const DEFAULT_MAX_ITEMS = 20;

/**
 * Get TMDB ID from item - handles various field names
 */
function getTmdbId(item: MediaItemShape): number | undefined {
  if (typeof item.tmdbId === "number") {
    return item.tmdbId;
  }
  // Some services use 'id' as TMDB ID for search results
  if (typeof item.id === "number" && !("type" in item)) {
    // Don't treat Jellyfin IDs (which are strings) as TMDB IDs
    return item.id;
  }
  return undefined;
}

/**
 * Get IMDB ID from item
 */
function getImdbId(item: MediaItemShape): string | undefined {
  if (typeof item.imdbId === "string" && item.imdbId.startsWith("tt")) {
    return item.imdbId;
  }
  return undefined;
}

/**
 * Get Jellyfin item ID - only for items that are from Jellyfin
 */
function getJellyfinId(item: MediaItemShape): string | undefined {
  // Jellyfin items have a string ID and usually have 'type' or 'imageUrl' field
  if (typeof item.id === "string" && ("type" in item || "imageUrl" in item)) {
    return item.id;
  }
  return undefined;
}

interface MediaResultsViewProps extends ToolResultProps<MediaResultsShape> {
  toolName?: string;
  /** Layout mode: auto (default), carousel, or grid */
  layout?: LayoutMode;
  /** Threshold for auto layout: use carousel if <= this count, grid otherwise */
  gridThreshold?: number;
  /** Maximum items to display (default: 20) */
  maxItems?: number;
  /** Jellyfin base URL for Watch links (passed from parent) */
  jellyfinBaseUrl?: string;
}

/**
 * MediaResultsView displays media results in a carousel or grid layout.
 *
 * This is a SHAPE-BASED renderer that works with any tool output matching
 * the MediaResultsShape: { results: [{ title, ... }], message? }
 *
 * Layout modes:
 * - "auto" (default): carousel for ≤6 items, grid for more
 * - "carousel": always horizontal scroll
 * - "grid": responsive grid layout
 *
 * Supports:
 * - Search results (Jellyseerr, Radarr, Sonarr)
 * - Library listings (Radarr, Sonarr, Jellyfin)
 * - Discovery/trending content
 * - Any plugin returning media items
 */
export function MediaResultsView({
  output,
  toolName,
  layout = "auto",
  gridThreshold = 6,
  maxItems = DEFAULT_MAX_ITEMS,
  jellyfinBaseUrl,
}: MediaResultsViewProps) {
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
      } catch (error) {
        console.error("Error requesting media:", error);
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

  if (!output || !output.results || output.results.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        {output?.message || "No results found."}
      </div>
    );
  }

  const { results: allResults, message } = output;

  // Apply max items limit
  const results = allResults.slice(0, maxItems);
  const isTruncated = allResults.length > maxItems;

  // Get total count from various possible fields
  const totalCount =
    output.totalResults ??
    output.totalMatching ??
    output.totalInLibrary ??
    results.length;
  const showingCount = output.showing ?? results.length;

  // Determine effective layout
  const effectiveLayout =
    layout === "auto"
      ? results.length <= gridThreshold
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
      {/* Message header */}
      {message && <p className="text-xs text-muted-foreground">{message}</p>}

      {/* Content */}
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
              {results.map((item, index) => (
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
          {results.map((item, index) => renderCard(item, index))}
        </div>
      )}

      {/* Pagination info */}
      {(totalCount > showingCount || isTruncated) && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {results.length} of{" "}
          {isTruncated ? allResults.length : totalCount} results
          {isTruncated && " (limited)"}
        </p>
      )}
    </div>
  );
}

// Export with old name for backwards compatibility
export { MediaResultsView as SearchResultsView };
