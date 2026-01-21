"use client";

import type { ToolUIPart } from "ai";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { DisplayableMedia } from "@/lib/plugins/base";

interface MediaMetadata {
  title: string;
  year?: number;
  overview?: string;
  posterUrl?: string | null;
  rating?: number;
  genres?: string[];
  runtime?: number;
  seasonCount?: number;
}

interface ApprovalCardProps {
  /** Tool name for detection */
  toolName: string;
  /** Tool input parameters */
  input: ToolUIPart["input"];
  /** Quality profile name (if resolved) */
  qualityProfileName?: string;
  /** Pre-fetched metadata from tool input - if provided, skips API fetch */
  metadata?: DisplayableMedia | null;
  /** Callback when approved */
  onApprove: () => void;
  /** Callback when denied */
  onDeny: () => void;
  /** Whether buttons are disabled */
  isLoading?: boolean;
}

/**
 * Rich approval card for movie and TV show additions.
 * Uses metadata from tool input when available, falls back to API fetch.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: View logic is complex
export function ApprovalCard({
  toolName,
  input,
  qualityProfileName,
  metadata: providedMetadata,
  onApprove,
  onDeny,
  isLoading,
}: ApprovalCardProps) {
  const [fetchedMetadata, setFetchedMetadata] = useState<MediaMetadata | null>(
    null
  );
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract IDs from input
  const tmdbId = (input as { tmdbId?: number })?.tmdbId;
  const tvdbId = (input as { tvdbId?: number })?.tvdbId;
  const qualityProfileId = (input as { qualityProfileId?: number })
    ?.qualityProfileId;
  const minimumAvailability = (input as { minimumAvailability?: string })
    ?.minimumAvailability;
  const searchForMovie = (input as { searchForMovie?: boolean })
    ?.searchForMovie;
  const monitor = (input as { monitor?: string })?.monitor;
  const searchForMissingEpisodes = (
    input as { searchForMissingEpisodes?: boolean }
  )?.searchForMissingEpisodes;

  // Jellyseerr uses mediaType in input, Radarr/Sonarr use tool name
  const inputMediaType = (input as { mediaType?: "movie" | "tv" })?.mediaType;
  const isJellyseerr = toolName.toLowerCase().includes("requestmedia");

  // Determine if this is a movie based on input mediaType or tool name
  const isMovieTool = inputMediaType
    ? inputMediaType === "movie"
    : toolName.toLowerCase().includes("movie");
  const mediaType = isMovieTool ? "movie" : "series";

  // Jellyseerr uses TMDB for both movies and TV shows
  const is4k = (input as { is4k?: boolean })?.is4k;
  const seasons = (input as { seasons?: number[] })?.seasons;

  // Use provided metadata if available, otherwise use fetched
  const metadata: MediaMetadata | null = providedMetadata
    ? {
        title: providedMetadata.title,
        year: providedMetadata.year,
        overview: providedMetadata.overview,
        posterUrl: providedMetadata.posterUrl,
        rating: providedMetadata.rating,
        genres: providedMetadata.genres,
        runtime: providedMetadata.runtime,
        seasonCount: providedMetadata.seasonCount,
      }
    : fetchedMetadata;

  // Only fetch metadata if not provided from tool input
  useEffect(() => {
    // Skip fetch if metadata was provided
    if (providedMetadata) {
      return;
    }

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Logic is complex
    const fetchMetadata = async () => {
      // Jellyseerr uses TMDB for both movies and TV shows
      // Radarr uses TMDB for movies, Sonarr uses TVDB for series
      const id = isJellyseerr || isMovieTool ? tmdbId : tvdbId;
      if (!id) {
        return;
      }

      setIsFetching(true);
      setError(null);

      try {
        // Build URL with source parameter for Jellyseerr (uses TMDB for both movies and TV)
        const url = isJellyseerr
          ? `/api/media/lookup?type=${mediaType}&id=${id}&source=jellyseerr`
          : `/api/media/lookup?type=${mediaType}&id=${id}`;

        const response = await fetch(url, { cache: "force-cache" });

        if (!response.ok) {
          throw new Error("Failed to fetch metadata");
        }

        const data = await response.json();
        setFetchedMetadata({
          title: data.title,
          year: data.year,
          overview: data.overview,
          posterUrl: data.posterUrl,
          rating: data.rating,
          genres: data.genres,
          runtime: data.runtime,
          seasonCount: data.seasonCount,
        });
      } catch {
        // Fallback: just show the IDs
        setError("Could not fetch details");
      } finally {
        setIsFetching(false);
      }
    };

    fetchMetadata();
  }, [tmdbId, tvdbId, isMovieTool, isJellyseerr, mediaType, providedMetadata]);

  // If metadata was provided, we're never in a fetching state
  const isActuallyFetching = !providedMetadata && isFetching;

  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border-2 border-yellow-500/50 bg-yellow-500/5">
      {/* Header */}
      <div className="border-b border-yellow-500/30 bg-yellow-500/10 px-4 py-2">
        <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
          Approval Required -{" "}
          {isJellyseerr
            ? "Request Media"
            : isMovieTool
              ? "Add Movie"
              : "Add Series"}
        </p>
      </div>

      {/* Content */}
      <div className="flex gap-4 p-4">
        {/* Poster */}
        {isActuallyFetching ? (
          <div className="flex h-36 w-24 shrink-0 items-center justify-center rounded bg-muted">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : metadata?.posterUrl ? (
          <div className="relative h-36 w-24 shrink-0 overflow-hidden rounded bg-muted">
            <Image
              alt={`${metadata?.title || "Media"} poster`}
              className="object-cover"
              fill
              sizes="96px"
              src={metadata.posterUrl}
              unoptimized
            />
          </div>
        ) : (
          <div className="flex h-36 w-24 shrink-0 items-center justify-center rounded bg-muted text-4xl">
            {isMovieTool ? "🎬" : "📺"}
          </div>
        )}

        {/* Details */}
        <div className="min-w-0 flex-1">
          {metadata ? (
            <>
              <h3 className="line-clamp-2 font-semibold text-sm">
                {metadata.title}
                {metadata.year && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({metadata.year})
                  </span>
                )}
              </h3>

              {(metadata.rating ||
                metadata.runtime ||
                metadata.seasonCount) && (
                <p className="mt-1 text-xs text-yellow-600">
                  {metadata.rating && `★ ${metadata.rating.toFixed(1)}`}
                  {metadata.runtime && ` - ${metadata.runtime} min`}
                  {metadata.seasonCount && ` - ${metadata.seasonCount} seasons`}
                </p>
              )}

              {metadata.genres && metadata.genres.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {metadata.genres.slice(0, 3).join(", ")}
                </p>
              )}

              {metadata.overview && (
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {metadata.overview}
                </p>
              )}
            </>
          ) : error ? (
            <div className="text-sm">
              <p className="font-medium">
                {isMovieTool ? "Movie" : "Series"} #{tmdbId || tvdbId}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
            </div>
          ) : (
            <div className="text-sm">
              <p className="font-medium">Loading...</p>
            </div>
          )}

          {/* Settings */}
          <div className="mt-3 space-y-1 text-xs">
            {qualityProfileName ? (
              <p>
                <span className="font-medium">Quality:</span>{" "}
                {qualityProfileName}
              </p>
            ) : qualityProfileId ? (
              <p>
                <span className="font-medium">Quality Profile:</span> #
                {qualityProfileId}
              </p>
            ) : null}

            {minimumAvailability && (
              <p>
                <span className="font-medium">Availability:</span>{" "}
                {minimumAvailability}
              </p>
            )}

            {monitor && (
              <p>
                <span className="font-medium">Monitor:</span> {monitor}
              </p>
            )}

            {searchForMovie !== undefined && (
              <p>
                <span className="font-medium">Search:</span>{" "}
                {searchForMovie ? "Immediately" : "Later"}
              </p>
            )}

            {searchForMissingEpisodes !== undefined && (
              <p>
                <span className="font-medium">Search Missing:</span>{" "}
                {searchForMissingEpisodes ? "Yes" : "No"}
              </p>
            )}

            {/* Jellyseerr-specific settings */}
            {is4k !== undefined && (
              <p>
                <span className="font-medium">4K:</span> {is4k ? "Yes" : "No"}
              </p>
            )}

            {seasons && seasons.length > 0 && (
              <p>
                <span className="font-medium">Seasons:</span>{" "}
                {seasons.join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 border-t border-yellow-500/30 bg-yellow-500/5 px-4 py-3">
        <Button disabled={isLoading} onClick={onDeny} size="sm" variant="ghost">
          <XIcon className="mr-1 size-4" />
          Deny
        </Button>
        <Button
          className="bg-green-600 hover:bg-green-700"
          disabled={isLoading}
          onClick={onApprove}
          size="sm"
          variant="default"
        >
          <CheckIcon className="mr-1 size-4" />
          Approve
        </Button>
      </div>
    </div>
  );
}

/**
 * Check if a tool name should use the rich approval card.
 */
export function shouldUseApprovalCard(toolName: string): boolean {
  const approvalToolNames = [
    "addRadarrMovie",
    "addSonarrSeries",
    "addMovie",
    "addSeries",
    "requestMedia", // Jellyseerr
  ];
  return approvalToolNames.some(
    (name) =>
      toolName === name ||
      toolName.toLowerCase().includes("addmovie") ||
      toolName.toLowerCase().includes("addseries") ||
      toolName.toLowerCase().includes("requestmedia")
  );
}
