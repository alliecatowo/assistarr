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
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDiscover } from "./discover-context";

interface Genre {
  id: string;
  label: string;
  icon: React.ElementType;
  query: string;
}

const GENRES: Genre[] = [
  {
    id: "action",
    label: "Action",
    icon: SwordIcon,
    query: "action movies and shows",
  },
  {
    id: "comedy",
    label: "Comedy",
    icon: LaughIcon,
    query: "comedy movies and shows",
  },
  {
    id: "drama",
    label: "Drama",
    icon: DramaIcon,
    query: "drama movies and shows",
  },
  {
    id: "horror",
    label: "Horror",
    icon: GhostIcon,
    query: "horror movies and shows",
  },
  {
    id: "scifi",
    label: "Sci-Fi",
    icon: RocketIcon,
    query: "science fiction movies and shows",
  },
  {
    id: "romance",
    label: "Romance",
    icon: HeartIcon,
    query: "romantic movies and shows",
  },
  {
    id: "thriller",
    label: "Thriller",
    icon: ShieldIcon,
    query: "thriller movies and shows",
  },
  {
    id: "fantasy",
    label: "Fantasy",
    icon: WandSparklesIcon,
    query: "fantasy movies and shows",
  },
  {
    id: "documentary",
    label: "Docs",
    icon: FilmIcon,
    query: "documentary films",
  },
  {
    id: "animation",
    label: "Animation",
    icon: TvIcon,
    query: "animated movies and shows",
  },
  {
    id: "crime",
    label: "Crime",
    icon: SearchIcon,
    query: "crime movies and shows",
  },
  {
    id: "adventure",
    label: "Adventure",
    icon: TreesIcon,
    query: "adventure movies and shows",
  },
];

interface GenreFiltersProps {
  disabled?: boolean;
}

export function GenreFilters({ disabled }: GenreFiltersProps) {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const { submitQuery, isLoading } = useDiscover();

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

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-6">
      {GENRES.map((genre) => {
        const Icon = genre.icon;
        const isSelected = selectedGenre === genre.id;

        return (
          <Button
            className={cn(
              "gap-1.5 transition-all",
              isSelected &&
                "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
            disabled={disabled || isLoading}
            key={genre.id}
            onClick={() => handleGenreClick(genre)}
            size="sm"
            variant={isSelected ? "default" : "outline"}
          >
            <Icon className="size-3.5" />
            {genre.label}
          </Button>
        );
      })}
    </div>
  );
}
