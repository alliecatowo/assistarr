"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { DiscoverItem } from "../discover-context";

// =============================================================================
// Pitch Cache - Store generated pitches to avoid regenerating
// =============================================================================

const PITCH_CACHE_KEY = "assistarr_pitch_cache";
const PITCH_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface PitchCacheEntry {
  pitch: string;
  hasProfile: boolean;
  timestamp: number;
}

interface PitchCache {
  [key: string]: PitchCacheEntry;
}

function getPitchCacheKey(tmdbId: number, mediaType: string): string {
  return `${mediaType}_${tmdbId}`;
}

function getCachedPitch(
  tmdbId: number,
  mediaType: string
): PitchCacheEntry | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const cached = sessionStorage.getItem(PITCH_CACHE_KEY);
    if (!cached) {
      return null;
    }
    const cache: PitchCache = JSON.parse(cached);
    const key = getPitchCacheKey(tmdbId, mediaType);
    const entry = cache[key];
    if (!entry) {
      return null;
    }
    if (Date.now() - entry.timestamp > PITCH_CACHE_TTL_MS) {
      // Expired - remove entry
      delete cache[key];
      sessionStorage.setItem(PITCH_CACHE_KEY, JSON.stringify(cache));
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function setCachedPitch(
  tmdbId: number,
  mediaType: string,
  pitch: string,
  hasProfile: boolean
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const cached = sessionStorage.getItem(PITCH_CACHE_KEY);
    const cache: PitchCache = cached ? JSON.parse(cached) : {};
    const key = getPitchCacheKey(tmdbId, mediaType);
    cache[key] = { pitch, hasProfile, timestamp: Date.now() };
    sessionStorage.setItem(PITCH_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage quota exceeded or other error - ignore
  }
}

// =============================================================================
// Types
// =============================================================================

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

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function mapToDiscoverItem(s: MediaDetails): DiscoverItem {
  return {
    id: s.id,
    title: s.title,
    year: s.year,
    posterUrl: s.posterUrl,
    rating: s.rating,
    mediaType: s.mediaType,
    tmdbId: s.tmdbId,
    status: s.status,
  };
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

    const abortController = new AbortController();

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/discover/similar?tmdbId=${tmdbId}&mediaType=${mediaType}`,
          { signal: abortController.signal }
        );
        if (!response.ok || abortController.signal.aborted) {
          return;
        }
        const data = await response.json();
        setDetails(data.details);
        setSimilar(data.similar.map(mapToDiscoverItem));
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }
        // Failed to fetch details - will show basic info
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      abortController.abort();
    };
  }, [tmdbId, mediaType]);

  return { details, similar, isLoading };
}

export function useMediaPitch(
  tmdbId: number | undefined,
  mediaType: "movie" | "tv",
  /** Pre-existing pitch from top picks - avoids regenerating */
  existingPitch?: string
) {
  // Initialize from existing pitch or cache
  const [pitch, setPitch] = useState<PitchData | null>(() => {
    if (existingPitch) {
      return { pitch: existingPitch, hasProfile: true };
    }
    if (tmdbId) {
      const cached = getCachedPitch(tmdbId, mediaType);
      if (cached) {
        return { pitch: cached.pitch, hasProfile: cached.hasProfile };
      }
    }
    return null;
  });
  const [isPitchLoading, setIsPitchLoading] = useState(false);

  useEffect(() => {
    // Skip fetching if we already have a pitch from top picks or cache
    if (existingPitch || !tmdbId) {
      return;
    }

    // Check cache first
    const cached = getCachedPitch(tmdbId, mediaType);
    if (cached) {
      setPitch({ pitch: cached.pitch, hasProfile: cached.hasProfile });
      return;
    }

    const abortController = new AbortController();

    const fetchPitch = async () => {
      setIsPitchLoading(true);
      try {
        const response = await fetch(
          `/api/discover/pitch?tmdbId=${tmdbId}&mediaType=${mediaType}`,
          { signal: abortController.signal }
        );
        if (!response.ok || abortController.signal.aborted) {
          return;
        }
        const data = await response.json();
        setPitch(data);
        // Cache the pitch for future use
        setCachedPitch(tmdbId, mediaType, data.pitch, data.hasProfile);
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }
        // Failed to fetch pitch - will just show overview
      } finally {
        if (!abortController.signal.aborted) {
          setIsPitchLoading(false);
        }
      }
    };

    fetchPitch();

    return () => {
      abortController.abort();
    };
  }, [tmdbId, mediaType, existingPitch]);

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
