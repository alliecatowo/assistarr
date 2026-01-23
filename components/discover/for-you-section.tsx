"use client";

import { RefreshCwIcon, SparklesIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DiscoverItem } from "./discover-context";
import { DiscoverRow } from "./discover-row";

// Cache configuration
const CACHE_KEY = "assistarr_for_you";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface TasteProfile {
  topGenres: { genre: string; count: number }[];
  favoriteDecades: { decade: string; count: number }[];
  totalItems: number;
}

interface ForYouResponse {
  recommendations: DiscoverItem[];
  profile: TasteProfile | null;
  message: string;
}

interface CachedData {
  recommendations: DiscoverItem[];
  profile: TasteProfile | null;
  timestamp: number;
}

function getCachedForYou(): {
  recommendations: DiscoverItem[];
  profile: TasteProfile | null;
} | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) {
      return null;
    }
    const data: CachedData = JSON.parse(cached);
    if (Date.now() - data.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return { recommendations: data.recommendations, profile: data.profile };
  } catch {
    return null;
  }
}

function setCachedForYou(
  recommendations: DiscoverItem[],
  profile: TasteProfile | null
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const data: CachedData = {
      recommendations,
      profile,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded or other error - ignore
  }
}

export function ForYouSection() {
  const [recommendations, setRecommendations] = useState<DiscoverItem[]>([]);
  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchRecommendations = useCallback(async (isRefresh = false) => {
    // Check cache first (unless refreshing)
    if (!isRefresh) {
      const cached = getCachedForYou();
      if (cached && cached.recommendations.length > 0) {
        setRecommendations(cached.recommendations);
        setProfile(cached.profile);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/discover/for-you");
      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data: ForYouResponse = await response.json();
      setRecommendations(data.recommendations);
      setProfile(data.profile);
      setCachedForYou(data.recommendations, data.profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) {
      return;
    }
    hasFetched.current = true;
    fetchRecommendations();
  }, [fetchRecommendations]);

  if (isLoading) {
    return (
      <section className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <SparklesIcon className="size-4 text-primary" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="flex gap-3 overflow-hidden justify-center">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div className="shrink-0 space-y-2" key={i}>
              <Skeleton className="h-52 w-36 rounded-lg" />
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <SparklesIcon className="size-4 text-primary" />
          <h3 className="text-base font-semibold">For You</h3>
        </div>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-center">
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button
            className="mt-2 h-7 text-xs"
            onClick={() => fetchRecommendations(true)}
            size="sm"
            variant="outline"
          >
            <RefreshCwIcon className="mr-1 size-3" />
            Retry
          </Button>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return (
      <section className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <SparklesIcon className="size-4 text-primary" />
          <h3 className="text-base font-semibold">For You</h3>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Add movies and shows to your library to get personalized
            recommendations
          </p>
        </div>
      </section>
    );
  }

  const genreText = profile?.topGenres
    .slice(0, 3)
    .map((g) => g.genre)
    .join(", ");

  return (
    <section className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-4 text-primary" />
          <h3 className="text-base font-semibold">For You</h3>
          {profile && (
            <span className="text-xs text-muted-foreground">
              Based on your love of {genreText}
            </span>
          )}
        </div>
        <Button
          className="h-7 px-2 text-xs"
          onClick={() => fetchRecommendations(true)}
          size="sm"
          variant="ghost"
        >
          <RefreshCwIcon className="mr-1 size-3" />
          Refresh
        </Button>
      </div>
      <DiscoverRow items={recommendations} showReasons />
    </section>
  );
}
