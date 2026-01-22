"use client";

import {
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  FilmIcon,
  StarIcon,
  TvIcon,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

interface MediaDetails {
  id: number;
  title: string;
  year?: number;
  overview?: string;
  posterUrl?: string | null;
  rating?: number;
  runtime?: number;
  genres?: string[];
  mediaType: "movie" | "tv";
  isAvailable?: boolean;
  isPending?: boolean;
}

interface InlineMediaLinkProps {
  title: string;
  tmdbId: string;
  mediaType?: "movie" | "tv";
}

type FetchStatus = "idle" | "loading" | "success" | "error";

/**
 * Inline media link that shows a hover card with media details.
 * Fetches data on hover with a slight delay to avoid spurious requests.
 */
export function InlineMediaLink({
  title,
  tmdbId,
  mediaType = "movie",
}: InlineMediaLinkProps) {
  const [media, setMedia] = useState<MediaDetails | null>(null);
  const [status, setStatus] = useState<FetchStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetchMediaDetails = useCallback(async () => {
    if (status === "loading" || status === "success") {
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const response = await fetch(`/api/media/${tmdbId}?type=${mediaType}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch media details");
      }

      const data: MediaDetails = await response.json();
      setMedia(data);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setStatus("error");
    }
  }, [tmdbId, mediaType, status]);

  const getStatusBadge = () => {
    if (media?.isAvailable) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400 border border-green-500/30">
          <CheckCircleIcon className="size-3" />
          Available
        </span>
      );
    }
    if (media?.isPending) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400 border border-yellow-500/30">
          <ClockIcon className="size-3" />
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground border border-border">
        <CircleIcon className="size-3" />
        Not Available
      </span>
    );
  };

  return (
    <HoverCard closeDelay={100} openDelay={300}>
      <HoverCardTrigger asChild>
        <button
          className={cn(
            "inline text-left font-medium underline decoration-dotted underline-offset-2",
            "hover:decoration-solid hover:text-primary transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 rounded-sm"
          )}
          onFocus={fetchMediaDetails}
          onMouseEnter={fetchMediaDetails}
          type="button"
        >
          {title}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="w-80 p-0 overflow-hidden"
        side="top"
        sideOffset={8}
      >
        {status === "loading" && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-pulse text-sm text-muted-foreground">
              Loading...
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="p-4 text-sm text-muted-foreground">
            {error || "Could not load media details"}
          </div>
        )}

        {status === "success" && media && (
          <div className="flex gap-3 p-3">
            {/* Poster */}
            <div className="relative h-[120px] w-[80px] flex-shrink-0 overflow-hidden rounded-md bg-muted">
              {media.posterUrl ? (
                <Image
                  alt={`${media.title} poster`}
                  className="object-cover"
                  fill
                  sizes="80px"
                  src={media.posterUrl}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  {media.mediaType === "tv" ? (
                    <TvIcon className="size-6" />
                  ) : (
                    <FilmIcon className="size-6" />
                  )}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col gap-1.5 min-w-0">
              <div>
                <h4 className="font-semibold text-sm leading-tight line-clamp-2">
                  {media.title}
                </h4>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  {media.year && <span>{media.year}</span>}
                  {media.runtime && (
                    <>
                      <span className="text-border">|</span>
                      <span>{media.runtime}min</span>
                    </>
                  )}
                </div>
              </div>

              {/* Rating */}
              {media.rating !== undefined && media.rating > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <StarIcon className="size-3 fill-yellow-500 text-yellow-500" />
                  <span>{media.rating.toFixed(1)}</span>
                </div>
              )}

              {/* Genres */}
              {media.genres && media.genres.length > 0 && (
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {media.genres.slice(0, 3).join(", ")}
                </div>
              )}

              {/* Status */}
              <div className="mt-auto pt-1">{getStatusBadge()}</div>
            </div>
          </div>
        )}

        {status === "idle" && (
          <div className="p-4 text-sm text-muted-foreground">
            Hover to load details
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

/**
 * Parse text for inline media links in the format [[Title|tmdbId|mediaType]]
 * Returns an array of text segments and InlineMediaLink components
 */
export function parseInlineMediaLinks(text: string): (string | JSX.Element)[] {
  // Pattern: [[Title|tmdbId]] or [[Title|tmdbId|mediaType]]
  const pattern = /\[\[([^|\]]+)\|(\d+)(?:\|(movie|tv))?\]\]/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let keyIndex = 0;

  // Fix: Declaration and assignment in one place
  let match = pattern.exec(text);

  while (match !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the InlineMediaLink component
    const [, title, tmdbId, mediaType] = match;
    parts.push(
      <InlineMediaLink
        key={`media-${tmdbId}-${keyIndex++}`}
        mediaType={(mediaType as "movie" | "tv") || "movie"}
        title={title}
        tmdbId={tmdbId}
      />
    );

    lastIndex = match.index + match[0].length;
    match = pattern.exec(text);
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
