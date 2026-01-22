"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { DiscoverItem } from "../discover-context";

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

export function useMediaDetails(
  tmdbId: number | undefined,
  mediaType: "movie" | "tv"
) {
  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [similar, setSimilar] = useState<DiscoverItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tmdbId) {
      setIsLoading(false);
      return;
    }

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/discover/similar?tmdbId=${tmdbId}&mediaType=${mediaType}`
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
      } catch {
        // Failed to fetch details - will show basic info
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [tmdbId, mediaType]);

  return { details, similar, isLoading };
}

export function useMediaPitch(
  tmdbId: number | undefined,
  mediaType: "movie" | "tv"
) {
  const [pitch, setPitch] = useState<PitchData | null>(null);
  const [isPitchLoading, setIsPitchLoading] = useState(false);

  useEffect(() => {
    if (!tmdbId) {
      return;
    }

    const fetchPitch = async () => {
      setIsPitchLoading(true);
      try {
        const response = await fetch(
          `/api/discover/pitch?tmdbId=${tmdbId}&mediaType=${mediaType}`
        );
        if (response.ok) {
          const data = await response.json();
          setPitch(data);
        }
      } catch {
        // Failed to fetch pitch - will just show overview
      } finally {
        setIsPitchLoading(false);
      }
    };

    fetchPitch();
  }, [tmdbId, mediaType]);

  return { pitch, isPitchLoading };
}

export function useMediaRequest(
  item: DiscoverItem,
  onStatusChange?: (tmdbId: number, status: DiscoverItem["status"]) => void,
  setDetails?: React.Dispatch<React.SetStateAction<MediaDetails | null>>
) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequest = useCallback(async () => {
    if (!item.tmdbId || isRequesting) {
      return;
    }

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
      setDetails?.((prev) => (prev ? { ...prev, status: "requested" } : prev));
      onStatusChange?.(item.tmdbId, "requested");
    } catch {
      toast.error("Failed to request");
    } finally {
      setIsRequesting(false);
    }
  }, [item, isRequesting, onStatusChange, setDetails]);

  return { isRequesting, handleRequest };
}
