"use client";

import {
  CheckCircleIcon,
  ClockIcon,
  ExternalLinkIcon,
  LoaderIcon,
  PlayIcon,
  PlusIcon,
  SparklesIcon,
  StarIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DiscoverCard } from "./discover-card";
import type { DiscoverItem } from "./discover-context";

interface MediaDetails {
  id: number;
  title: string;
  year?: number;
  posterUrl: string | null;
  backdropUrl: string | null;
  overview?: string;
  rating?: number;
  runtime?: number;
  genres: string[];
  cast: { name: string; character: string; profileUrl: string | null }[];
  mediaType: "movie" | "tv";
  tmdbId: number;
  status: "available" | "requested" | "pending" | "unavailable";
  imdbId?: string;
}

interface PitchData {
  pitch: string;
  hasProfile: boolean;
}

interface ExpandedCardProps {
  item: DiscoverItem;
  onClose: () => void;
  onStatusChange?: (tmdbId: number, status: DiscoverItem["status"]) => void;
}

export function ExpandedCard({
  item,
  onClose,
  onStatusChange,
}: ExpandedCardProps) {
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [similar, setSimilar] = useState<DiscoverItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [pitch, setPitch] = useState<PitchData | null>(null);
  const [isPitchLoading, setIsPitchLoading] = useState(false);
  const [showFullOverview, setShowFullOverview] = useState(false);

  // Fetch details and similar content
  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/discover/similar?tmdbId=${item.tmdbId}&mediaType=${item.mediaType}`
        );
        if (response.ok) {
          const data = await response.json();
          setDetails(data.details);
          setSimilar(
            data.similar.map(
              (s: MediaDetails): DiscoverItem => ({
                id: s.id,
                title: s.title,
                year: s.year,
                posterUrl: s.posterUrl,
                rating: s.rating,
                mediaType: s.mediaType,
                tmdbId: s.tmdbId,
                status: s.status,
              })
            )
          );
        }
      } catch (_e) {
        // Failed to fetch details - will show basic info
      } finally {
        setIsLoading(false);
      }
    };

    if (item.tmdbId) {
      fetchDetails();
    }
  }, [item.tmdbId, item.mediaType]);

  // Fetch personalized pitch
  useEffect(() => {
    const fetchPitch = async () => {
      if (!item.tmdbId) return;

      setIsPitchLoading(true);
      try {
        const response = await fetch(
          `/api/discover/pitch?tmdbId=${item.tmdbId}&mediaType=${item.mediaType}`
        );
        if (response.ok) {
          const data = await response.json();
          setPitch(data);
        }
      } catch (_e) {
        // Failed to fetch pitch - will just show overview
      } finally {
        setIsPitchLoading(false);
      }
    };

    fetchPitch();
  }, [item.tmdbId, item.mediaType]);

  const handleRequest = useCallback(async () => {
    if (!item.tmdbId || isRequesting) return;

    setIsRequesting(true);
    try {
      const response = await fetch("/api/media/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: item.tmdbId,
          mediaType: item.mediaType,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to request");
        return;
      }
      toast.success(`Requested ${data.title || item.title}`);
      setDetails((prev) => (prev ? { ...prev, status: "requested" } : prev));
      onStatusChange?.(item.tmdbId, "requested");
    } catch {
      toast.error("Failed to request");
    } finally {
      setIsRequesting(false);
    }
  }, [item.tmdbId, item.mediaType, item.title, isRequesting, onStatusChange]);

  const status = details?.status ?? item.status;

  return (
    <div className="relative my-4 overflow-hidden rounded-xl border bg-card shadow-lg">
      {/* Close button */}
      <Button
        className="absolute right-2 top-2 z-20"
        onClick={onClose}
        size="icon"
        variant="ghost"
      >
        <XIcon className="size-5" />
      </Button>

      {isLoading ? (
        <div className="p-6 space-y-4">
          <div className="flex gap-4">
            <Skeleton className="h-48 w-32 rounded-lg shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Backdrop image */}
          {details?.backdropUrl && (
            <div className="absolute inset-0 h-48 overflow-hidden">
              <Image
                alt=""
                className="object-cover opacity-30"
                fill
                sizes="100vw"
                src={details.backdropUrl}
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
            </div>
          )}

          {/* Content */}
          <div className="relative z-10 p-6">
            <div className="flex gap-6">
              {/* Poster */}
              <div className="shrink-0">
                {details?.posterUrl || item.posterUrl ? (
                  <Image
                    alt={details?.title || item.title}
                    className="rounded-lg shadow-md"
                    height={192}
                    src={details?.posterUrl || item.posterUrl || ""}
                    unoptimized
                    width={128}
                  />
                ) : (
                  <div className="h-48 w-32 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
                    No Image
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold truncate">
                  {details?.title || item.title}
                </h2>

                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {(details?.year || item.year) && (
                    <span>{details?.year || item.year}</span>
                  )}
                  {details?.runtime && <span>{details.runtime} min</span>}
                  {(details?.rating || item.rating) && (
                    <span className="flex items-center gap-1 text-yellow-500">
                      <StarIcon className="size-4 fill-current" />
                      {(details?.rating || item.rating)?.toFixed(1)}
                    </span>
                  )}
                  <span className="capitalize">
                    {(details?.mediaType || item.mediaType) === "tv"
                      ? "TV Show"
                      : "Movie"}
                  </span>
                </div>

                {/* Genres */}
                {details?.genres && details.genres.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {details.genres.map((genre) => (
                      <span
                        className="rounded-full bg-muted px-2.5 py-0.5 text-xs"
                        key={genre}
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {/* Personalized Pitch */}
                {isPitchLoading ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <SparklesIcon className="size-3.5 animate-pulse" />
                      <span>Crafting a personalized pitch...</span>
                    </div>
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : pitch ? (
                  <div className="mt-3">
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="flex items-start gap-2">
                        <SparklesIcon className="size-4 shrink-0 text-primary mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground leading-relaxed">
                            {pitch.pitch}
                          </p>
                          {pitch.hasProfile && (
                            <p className="mt-1.5 text-[10px] text-muted-foreground">
                              Personalized for you
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Overview */}
                {details?.overview && (
                  <div className="mt-3">
                    {pitch ? (
                      // Collapsible when pitch is shown
                      <button
                        className="w-full text-left group"
                        onClick={() => setShowFullOverview(!showFullOverview)}
                        type="button"
                      >
                        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                          {showFullOverview ? "Hide" : "Show"} full description
                        </span>
                        {showFullOverview && (
                          <p className="mt-1.5 text-sm text-muted-foreground">
                            {details.overview}
                          </p>
                        )}
                      </button>
                    ) : (
                      // Show overview directly when no pitch
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {details.overview}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  {status === "available" && (
                    <Button size="sm">
                      <PlayIcon className="mr-1 size-4" />
                      Watch Now
                    </Button>
                  )}
                  {status === "unavailable" && (
                    <Button
                      disabled={isRequesting}
                      onClick={handleRequest}
                      size="sm"
                    >
                      {isRequesting ? (
                        <LoaderIcon className="mr-1 size-4 animate-spin" />
                      ) : (
                        <PlusIcon className="mr-1 size-4" />
                      )}
                      Request
                    </Button>
                  )}
                  {status === "requested" && (
                    <Button disabled size="sm" variant="outline">
                      <ClockIcon className="mr-1 size-4" />
                      Requested
                    </Button>
                  )}
                  {status === "pending" && (
                    <Button disabled size="sm" variant="outline">
                      <CheckCircleIcon className="mr-1 size-4" />
                      Pending
                    </Button>
                  )}
                  {details?.imdbId && (
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={`https://www.imdb.com/title/${details.imdbId}`}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <ExternalLinkIcon className="mr-1 size-4" />
                        IMDb
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Cast */}
            {details?.cast && details.cast.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-2">Cast</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {details.cast.map((person, i) => (
                    <div
                      className="shrink-0 text-center w-16"
                      key={`${person.name}-${i}`}
                    >
                      {person.profileUrl ? (
                        <Image
                          alt={person.name}
                          className="rounded-full mx-auto"
                          height={48}
                          src={person.profileUrl}
                          unoptimized
                          width={48}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground text-xs">
                          ?
                        </div>
                      )}
                      <p className="mt-1 text-xs font-medium truncate">
                        {person.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {person.character}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Similar */}
            {similar.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-2">
                  Similar to {details?.title || item.title}
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {similar.map((s) => (
                    <DiscoverCard
                      isRequesting={false}
                      item={s}
                      key={s.id}
                      onRequest={(tmdbId, mediaType) =>
                        console.log("Request:", tmdbId, mediaType)
                      }
                      showReason={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
