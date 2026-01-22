"use client";

import {
  DramaIcon,
  FilmIcon,
  GhostIcon,
  HeartIcon,
  LaughIcon,
  RocketIcon,
  SearchIcon,
  ShieldIcon,
  SwordIcon,
  TreesIcon,
  TvIcon,
  WandSparklesIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDiscover } from "./discover-context";

interface Genre {
  id: string;
  label: string;
  icon: React.ElementType;
  query: string;
  tmdbId?: number;
}

const GENRES: Genre[] = [
  {
    id: "action",
    label: "Action",
    icon: SwordIcon,
    query: "action movies and shows",
    tmdbId: 28,
  },
  {
    id: "comedy",
    label: "Comedy",
    icon: LaughIcon,
    query: "comedy movies and shows",
    tmdbId: 35,
  },
  {
    id: "drama",
    label: "Drama",
    icon: DramaIcon,
    query: "drama movies and shows",
    tmdbId: 18,
  },
  {
    id: "horror",
    label: "Horror",
    icon: GhostIcon,
    query: "horror movies and shows",
    tmdbId: 27,
  },
  {
    id: "scifi",
    label: "Sci-Fi",
    icon: RocketIcon,
    query: "science fiction movies and shows",
    tmdbId: 878,
  },
  {
    id: "romance",
    label: "Romance",
    icon: HeartIcon,
    query: "romantic movies and shows",
    tmdbId: 10_749,
  },
  {
    id: "thriller",
    label: "Thriller",
    icon: ShieldIcon,
    query: "thriller movies and shows",
    tmdbId: 53,
  },
  {
    id: "fantasy",
    label: "Fantasy",
    icon: WandSparklesIcon,
    query: "fantasy movies and shows",
    tmdbId: 14,
  },
  {
    id: "documentary",
    label: "Docs",
    icon: FilmIcon,
    query: "documentary films",
    tmdbId: 99,
  },
  {
    id: "animation",
    label: "Animation",
    icon: TvIcon,
    query: "animated movies and shows",
    tmdbId: 16,
  },
  {
    id: "crime",
    label: "Crime",
    icon: SearchIcon,
    query: "crime movies and shows",
    tmdbId: 80,
  },
  {
    id: "adventure",
    label: "Adventure",
    icon: TreesIcon,
    query: "adventure movies and shows",
    tmdbId: 12,
  },
];

interface GenreCarouselProps {
  disabled?: boolean;
}

interface UserProfile {
  topGenres: { genre: string; count: number }[];
  totalItems: number;
}

export function GenreCarousel({ disabled }: GenreCarouselProps) {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { submitQuery, isLoading } = useDiscover();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch user's taste profile to personalize genre order
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/discover/for-you");
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setUserProfile(data.profile);
          }
        }
      } catch (_error) {
        // Failed to fetch profile - continue with default genre order
      }
    }
    fetchProfile();
  }, []);

  const handleGenreClick = useCallback(
    (genre: Genre) => {
      if (selectedGenre === genre.id) {
        // Deselect if clicking the same genre
        setSelectedGenre(null);
      } else {
        setSelectedGenre(genre.id);
        submitQuery(`recommend popular ${genre.query}`);
      }
    },
    [selectedGenre, submitQuery]
  );

  // Reorder genres based on user's top genres from library
  const orderedGenres = [...GENRES];
  if (userProfile?.topGenres && userProfile.topGenres.length > 0) {
    orderedGenres.sort((a, b) => {
      const aMatch = userProfile.topGenres.findIndex((g) =>
        a.label.toLowerCase().includes(g.genre.toLowerCase())
      );
      const bMatch = userProfile.topGenres.findIndex((g) =>
        b.label.toLowerCase().includes(g.genre.toLowerCase())
      );

      // Genres matching user's library come first
      if (aMatch !== -1 && bMatch === -1) return -1;
      if (aMatch === -1 && bMatch !== -1) return 1;
      if (aMatch !== -1 && bMatch !== -1) return aMatch - bMatch;

      // Otherwise keep original order
      return 0;
    });
  }

  return (
    <div className="relative w-full">
      <div
        className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-none scroll-smooth px-8"
        ref={scrollContainerRef}
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
        {orderedGenres.map((genre, index) => {
          const Icon = genre.icon;
          const isSelected = selectedGenre === genre.id;
          const isTopGenre =
            userProfile?.topGenres &&
            userProfile.topGenres.some((g) =>
              genre.label.toLowerCase().includes(g.genre.toLowerCase())
            );

          return (
            <Button
              className={cn(
                "h-7 gap-1 px-2.5 transition-all flex-shrink-0 whitespace-nowrap relative text-xs",
                isSelected &&
                  "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              disabled={disabled || isLoading}
              key={genre.id}
              onClick={() => handleGenreClick(genre)}
              size="sm"
              variant={isSelected ? "default" : "outline"}
            >
              <Icon className="size-3" />
              {genre.label}
              {isTopGenre && index < 3 && (
                <span className="absolute -top-0.5 -right-0.5 size-1.5 bg-primary rounded-full" />
              )}
            </Button>
          );
        })}
      </div>

      {/* Gradient fade on edges for better UX */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background via-background to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background via-background to-transparent" />
    </div>
  );
}
