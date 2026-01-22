"use client";

import { RefreshCwIcon, SparklesIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DiscoverItem } from "./discover-context";
import { DiscoverRow } from "./discover-row";

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

export function ForYouSection() {
  const [recommendations, setRecommendations] = useState<DiscoverItem[]>([]);
  const [profile, setProfile] = useState<TasteProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <SparklesIcon className="size-5 text-primary" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div className="shrink-0 space-y-2" key={i}>
              <Skeleton className="h-56 w-40 rounded-lg" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <SparklesIcon className="size-5 text-primary" />
          <h3 className="text-lg font-semibold">For You</h3>
        </div>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            className="mt-2"
            onClick={fetchRecommendations}
            size="sm"
            variant="outline"
          >
            <RefreshCwIcon className="mr-1 size-4" />
            Retry
          </Button>
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return (
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <SparklesIcon className="size-5 text-primary" />
          <h3 className="text-lg font-semibold">For You</h3>
        </div>
        <div className="rounded-lg border bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
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
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-5 text-primary" />
          <h3 className="text-lg font-semibold">For You</h3>
          {profile && (
            <span className="text-sm text-muted-foreground">
              Based on your love of {genreText}
            </span>
          )}
        </div>
        <Button
          className="h-8"
          onClick={fetchRecommendations}
          size="sm"
          variant="ghost"
        >
          <RefreshCwIcon className="mr-1 size-4" />
          Refresh
        </Button>
      </div>
      <DiscoverRow items={recommendations} showReasons />
    </section>
  );
}
