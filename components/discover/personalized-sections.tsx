"use client";

import {
  AwardIcon,
  CalendarIcon,
  FilmIcon,
  GemIcon,
  HeartIcon,
  RefreshCwIcon,
  SparklesIcon,
  StarIcon,
  TrendingUpIcon,
  UserIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { DiscoverItem } from "./discover-context";
import { DiscoverRow } from "./discover-row";

// =============================================================================
// Type Definitions
// =============================================================================

interface PersonalizedItem extends DiscoverItem {
  reason?: string;
}

interface PersonalizedSection {
  id: string;
  title: string;
  subtitle?: string;
  reason: string;
  items: PersonalizedItem[];
  type:
    | "director"
    | "actor"
    | "genre"
    | "decade"
    | "similar"
    | "new-releases"
    | "hidden-gems"
    | "critically-acclaimed"
    | "studio"
    | "network";
}

interface TasteProfileSummary {
  topGenres: { genre: string; count: number; percentage?: number }[];
  favoriteDecades: { decade: string; count: number; percentage?: number }[];
  favoriteDirectors: { name: string; count: number }[];
  favoriteActors: { name: string; count: number }[];
  totalItems: number;
  totalMovies: number;
  totalShows: number;
  totalRuntimeHours?: number;
  totalSizeGB?: number;
  averageRating?: number;
  genreDiversityScore?: number;
}

interface PersonalizedResponse {
  sections: PersonalizedSection[];
  profile: TasteProfileSummary | null;
  message: string;
}

// =============================================================================
// Icon Mapping
// =============================================================================

function getSectionIcon(type: PersonalizedSection["type"]) {
  switch (type) {
    case "director":
      return FilmIcon;
    case "actor":
      return UserIcon;
    case "genre":
      return HeartIcon;
    case "decade":
      return CalendarIcon;
    case "similar":
      return SparklesIcon;
    case "new-releases":
      return TrendingUpIcon;
    case "hidden-gems":
      return GemIcon;
    case "critically-acclaimed":
      return AwardIcon;
    case "studio":
    case "network":
      return FilmIcon;
    default:
      return StarIcon;
  }
}

function getSectionColor(type: PersonalizedSection["type"]) {
  switch (type) {
    case "director":
      return "text-purple-500";
    case "actor":
      return "text-blue-500";
    case "genre":
      return "text-pink-500";
    case "decade":
      return "text-amber-500";
    case "similar":
      return "text-primary";
    case "new-releases":
      return "text-green-500";
    case "hidden-gems":
      return "text-emerald-500";
    case "critically-acclaimed":
      return "text-yellow-500";
    case "studio":
    case "network":
      return "text-orange-500";
    default:
      return "text-primary";
  }
}

// =============================================================================
// Loading Skeleton
// =============================================================================

function PersonalizedSectionSkeleton() {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="size-5 rounded" />
        <Skeleton className="h-6 w-48" />
      </div>
      <Skeleton className="mb-3 h-4 w-64" />
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

// =============================================================================
// Taste Profile Card
// =============================================================================

interface TasteProfileCardProps {
  profile: TasteProfileSummary;
}

function TasteProfileCard({ profile }: TasteProfileCardProps) {
  const moviePercentage =
    profile.totalItems > 0
      ? Math.round((profile.totalMovies / profile.totalItems) * 100)
      : 0;
  const showPercentage = 100 - moviePercentage;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Library Stats */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your Library
          </p>
          <p className="text-3xl font-bold">
            {profile.totalItems.toLocaleString()}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Movies</span>
              <span className="font-medium">
                {profile.totalMovies.toLocaleString()} ({moviePercentage}%)
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-blue-500"
                style={{ width: `${moviePercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">TV Shows</span>
              <span className="font-medium">
                {profile.totalShows.toLocaleString()} ({showPercentage}%)
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-purple-500"
                style={{ width: `${showPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Top Genres with Counts */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Top Genres
          </p>
          <div className="space-y-1.5">
            {profile.topGenres.slice(0, 5).map((g, idx) => (
              <div className="space-y-0.5" key={g.genre}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{g.genre}</span>
                  <span className="text-muted-foreground">
                    {g.count} ({g.percentage ? Math.round(g.percentage) : 0}%)
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${
                      idx === 0
                        ? "bg-pink-500"
                        : idx === 1
                          ? "bg-purple-500"
                          : idx === 2
                            ? "bg-blue-500"
                            : idx === 3
                              ? "bg-green-500"
                              : "bg-amber-500"
                    }`}
                    style={{ width: `${g.percentage ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Favorite Decades */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Favorite Eras
          </p>
          <div className="space-y-1.5">
            {profile.favoriteDecades.slice(0, 4).map((d, idx) => (
              <div className="space-y-0.5" key={d.decade}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{d.decade}</span>
                  <span className="text-muted-foreground">
                    {d.count} ({d.percentage ? Math.round(d.percentage) : 0}%)
                  </span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${
                      idx === 0
                        ? "bg-amber-500"
                        : idx === 1
                          ? "bg-orange-500"
                          : idx === 2
                            ? "bg-yellow-500"
                            : "bg-red-500"
                    }`}
                    style={{ width: `${d.percentage ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats & Insights */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Your Stats
          </p>
          <div className="space-y-2">
            {profile.averageRating !== undefined &&
              profile.averageRating > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg Rating</span>
                  <span className="flex items-center gap-1 font-medium">
                    <StarIcon className="size-3 fill-yellow-500 text-yellow-500" />
                    {profile.averageRating.toFixed(1)}
                  </span>
                </div>
              )}
            {profile.totalRuntimeHours !== undefined &&
              profile.totalRuntimeHours > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Watch Time</span>
                  <span className="font-medium">
                    {profile.totalRuntimeHours >= 1000
                      ? `${(profile.totalRuntimeHours / 1000).toFixed(1)}k hrs`
                      : `${Math.round(profile.totalRuntimeHours)} hrs`}
                  </span>
                </div>
              )}
            {profile.totalSizeGB !== undefined && profile.totalSizeGB > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Library Size</span>
                <span className="font-medium">
                  {profile.totalSizeGB >= 1000
                    ? `${(profile.totalSizeGB / 1000).toFixed(1)} TB`
                    : `${Math.round(profile.totalSizeGB)} GB`}
                </span>
              </div>
            )}
            {profile.genreDiversityScore !== undefined &&
              profile.genreDiversityScore > 0 && (
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Diversity</span>
                    <span className="font-medium">
                      {profile.genreDiversityScore}/100
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                      style={{ width: `${profile.genreDiversityScore}%` }}
                    />
                  </div>
                </div>
              )}
          </div>

          {/* Favorite Directors/Actors */}
          {(profile.favoriteDirectors.length > 0 ||
            profile.favoriteActors.length > 0) && (
            <div className="mt-3 space-y-1 border-t pt-2">
              {profile.favoriteDirectors.length > 0 && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Top Director: </span>
                  <span className="font-medium">
                    {profile.favoriteDirectors[0].name} (
                    {profile.favoriteDirectors[0].count})
                  </span>
                </div>
              )}
              {profile.favoriteActors.length > 0 && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Top Actor: </span>
                  <span className="font-medium">
                    {profile.favoriteActors[0].name} (
                    {profile.favoriteActors[0].count})
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Taste Profile Sheet Trigger Button
// =============================================================================

interface TasteProfileTriggerProps {
  profile: TasteProfileSummary | null;
  isLoading: boolean;
}

export function TasteProfileTrigger({
  profile,
  isLoading,
}: TasteProfileTriggerProps) {
  if (isLoading) {
    return (
      <div className="mb-3 flex justify-center">
        <Skeleton className="h-8 w-40" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="mb-3 flex justify-center">
      <Sheet>
        <SheetTrigger asChild>
          <Button className="h-7 gap-1.5 text-xs" size="sm" variant="outline">
            <SparklesIcon className="size-3.5" />
            View Taste Profile
          </Button>
        </SheetTrigger>
        <SheetContent
          className="w-full sm:max-w-lg overflow-y-auto"
          side="right"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <SparklesIcon className="size-5 text-primary" />
              Your Taste Profile
            </SheetTitle>
            <SheetDescription>
              Insights based on your library of{" "}
              {profile.totalItems.toLocaleString()} items
            </SheetDescription>
          </SheetHeader>
          <TasteProfileCard profile={profile} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

// =============================================================================
// Individual Section Component
// =============================================================================

interface PersonalizedSectionRowProps {
  section: PersonalizedSection;
}

function PersonalizedSectionRow({ section }: PersonalizedSectionRowProps) {
  const Icon = getSectionIcon(section.type);
  const iconColor = getSectionColor(section.type);

  return (
    <section className="mb-8">
      <div className="mb-1 flex items-center gap-2">
        <Icon className={`size-5 ${iconColor}`} />
        <h3 className="text-lg font-semibold">{section.title}</h3>
      </div>
      {section.subtitle && (
        <p className="mb-3 text-sm text-muted-foreground">{section.subtitle}</p>
      )}
      <DiscoverRow
        items={section.items.map((item) => ({
          ...item,
          id: item.id,
          title: item.title,
          year: item.year,
          posterUrl: item.posterUrl,
          rating: item.rating,
          mediaType: item.mediaType,
          tmdbId: item.tmdbId,
          status: item.status,
          reason: item.reason,
        }))}
        showReasons
      />
    </section>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function PersonalizedSections() {
  const [sections, setSections] = useState<PersonalizedSection[]>([]);
  const [profile, setProfile] = useState<TasteProfileSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonalized = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/discover/personalized");
      if (!response.ok) {
        throw new Error("Failed to fetch personalized recommendations");
      }

      const data: PersonalizedResponse = await response.json();
      setSections(data.sections);
      setProfile(data.profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPersonalized();
  }, [fetchPersonalized]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8">
        <TasteProfileTrigger isLoading={true} profile={null} />
        <PersonalizedSectionSkeleton />
        <PersonalizedSectionSkeleton />
        <PersonalizedSectionSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <SparklesIcon className="size-5 text-primary" />
          <h3 className="text-lg font-semibold">Personalized For You</h3>
        </div>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            className="mt-2"
            onClick={fetchPersonalized}
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

  // Empty state
  if (sections.length === 0) {
    return (
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <SparklesIcon className="size-5 text-primary" />
          <h3 className="text-lg font-semibold">Personalized For You</h3>
        </div>
        <div className="rounded-lg border bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Add more movies and shows to your library to unlock deeply
            personalized recommendations based on your favorite directors,
            actors, and genres.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-2">
      {/* Taste Profile Button (opens sheet) */}
      <TasteProfileTrigger isLoading={false} profile={profile} />

      {/* Header with Refresh */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">Personalized For You</h2>
        </div>
        <Button
          className="h-8"
          onClick={fetchPersonalized}
          size="sm"
          variant="ghost"
        >
          <RefreshCwIcon className="mr-1 size-4" />
          Refresh
        </Button>
      </div>

      {/* Personalized Sections */}
      {sections.map((section) => (
        <PersonalizedSectionRow key={section.id} section={section} />
      ))}
    </div>
  );
}
