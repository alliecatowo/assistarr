"use client";

import { CheckCircleIcon, Loader2Icon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { SuccessConfirmationShape } from "./types";

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

interface SuccessCardProps {
  output: SuccessConfirmationShape;
  toolName: string;
}

/**
 * Rich success card for completed media requests.
 * Shows the movie/series poster and confirmation message.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: View logic is complex
export function SuccessCard({ output, toolName }: SuccessCardProps) {
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const {
    title,
    tmdbId,
    tvdbId,
    mediaType,
    status,
    is4k,
    message,
    posterUrl,
    year,
  } = output;

  // Determine if this is a movie or TV show
  const isMovie =
    mediaType === "movie" || toolName.toLowerCase().includes("movie");
  const isJellyseerr = toolName.toLowerCase().includes("requestmedia");

  // Fetch metadata if we don't have a poster URL
  useEffect(() => {
    if (posterUrl) {
      setMetadata({ title, year, posterUrl });
      return;
    }

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Logic is complex
    const fetchMetadata = async () => {
      const id = isJellyseerr || isMovie ? tmdbId : tvdbId;
      if (!id) {
        return;
      }

      setIsFetching(true);
      try {
        const type = isMovie ? "movie" : "series";
        const url = isJellyseerr
          ? `/api/media/lookup?type=${type}&id=${id}&source=jellyseerr`
          : `/api/media/lookup?type=${type}&id=${id}`;

        const response = await fetch(url, { cache: "force-cache" });
        if (response.ok) {
          const data = await response.json();
          setMetadata({
            title: data.title || title,
            year: data.year,
            overview: data.overview,
            posterUrl: data.posterUrl,
            rating: data.rating,
            genres: data.genres,
            runtime: data.runtime,
            seasonCount: data.seasonCount,
          });
        }
      } catch {
        // Fallback to title only
        setMetadata({ title, year });
      } finally {
        setIsFetching(false);
      }
    };

    fetchMetadata();
  }, [tmdbId, tvdbId, isMovie, isJellyseerr, posterUrl, title, year]);

  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-green-500/30 bg-green-500/5">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-green-500/20 bg-green-500/10 px-4 py-2">
        <CheckCircleIcon className="size-4 text-green-600" />
        <p className="text-xs font-medium text-green-700 dark:text-green-300">
          {status || "Request Successful"}
        </p>
        {is4k && (
          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
            4K
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex gap-4 p-4">
        {/* Poster */}
        {isFetching ? (
          <div className="flex h-28 w-[75px] shrink-0 items-center justify-center rounded bg-muted">
            <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : metadata?.posterUrl ? (
          <div className="relative h-28 w-[75px] shrink-0 overflow-hidden rounded bg-muted">
            <Image
              alt={`${metadata.title || title} poster`}
              className="object-cover"
              fill
              sizes="75px"
              src={metadata.posterUrl}
            />
          </div>
        ) : (
          <div className="flex h-28 w-[75px] shrink-0 items-center justify-center rounded bg-muted text-3xl">
            {isMovie ? "🎬" : "📺"}
          </div>
        )}

        {/* Details */}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-semibold text-sm">
            {metadata?.title || title}
            {(metadata?.year || year) && (
              <span className="text-muted-foreground">
                {" "}
                ({metadata?.year || year})
              </span>
            )}
          </h3>

          {metadata?.rating && (
            <p className="mt-1 text-xs text-muted-foreground">
              ★ {metadata.rating.toFixed(1)}
              {metadata.runtime && ` • ${metadata.runtime} min`}
              {metadata.seasonCount && ` • ${metadata.seasonCount} seasons`}
            </p>
          )}

          {metadata?.genres && metadata.genres.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {metadata.genres.slice(0, 3).join(", ")}
            </p>
          )}

          {message && (
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
