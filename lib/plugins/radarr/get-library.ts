import { tool } from "ai";
import { z } from "zod";
import type { DisplayableMedia, ToolFactoryProps } from "../core/types";
import { deriveMediaStatus } from "../core/utils";
import { RadarrClient } from "./client";
import type { RadarrMovie } from "./types";

export const getLibrary = ({ session: _session, config }: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
    description:
      "Get movies from the Radarr library with filtering. Use genre filter for 'comedy movies', 'action films', etc. Use hasFile filter to show only downloaded movies ready to watch.",
    inputSchema: z.object({
      genre: z.string().optional().describe("Filter by genre"),
      hasFile: z.boolean().optional().describe("Filter by downloaded status"),
      monitored: z.boolean().optional().describe("Filter by monitored status"),
      yearFrom: z.number().optional().describe("Filter movies from this year"),
      yearTo: z.number().optional().describe("Filter movies up to this year"),
      sortBy: z
        .enum(["title", "dateAdded", "year", "rating"])
        .optional()
        .default("title")
        .describe("How to sort the results"),
      limit: z
        .number()
        .optional()
        .default(50)
        .describe("Maximum number of movies to return"),
    }),
    execute: async ({
      genre,
      hasFile,
      monitored,
      yearFrom,
      yearTo,
      sortBy,
      limit,
    }) => {
      try {
        const movies = await client.get<RadarrMovie[]>("/movie");

        const filteredMovies = filterMovies(movies, {
          genre,
          hasFile,
          monitored,
          yearFrom,
          yearTo,
        });
        const sortedMovies = sortMovies(filteredMovies, sortBy as string);
        const limitedMovies = sortedMovies.slice(0, limit);

        const filterDesc = buildFilterDescription({
          genre,
          hasFile,
          monitored,
          yearFrom,
          yearTo,
        });

        const displayableMovies = mapToDisplayable(limitedMovies);

        return {
          results: displayableMovies,
          totalInLibrary: movies.length,
          totalMatching: filteredMovies.length,
          showing: limitedMovies.length,
          message:
            filteredMovies.length > 0
              ? `Found ${filteredMovies.length} movie(s)${filterDesc}. Showing ${limitedMovies.length}.`
              : `No movies found${filterDesc}.`,
        };
      } catch (error) {
        return {
          results: [],
          message: `Error getting library: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};

interface FilterOptions {
  genre?: string;
  hasFile?: boolean;
  monitored?: boolean;
  yearFrom?: number;
  yearTo?: number;
}

function filterMovies(movies: RadarrMovie[], options: FilterOptions) {
  let result = movies;
  if (options.genre) {
    const genreLower = options.genre.toLowerCase();
    result = result.filter((m) =>
      m.genres?.some((g) => g.toLowerCase().includes(genreLower))
    );
  }
  if (options.hasFile !== undefined) {
    result = result.filter((m) => m.hasFile === options.hasFile);
  }
  if (options.monitored !== undefined) {
    result = result.filter((m) => m.monitored === options.monitored);
  }
  if (options.yearFrom !== undefined) {
    const minYear = options.yearFrom;
    result = result.filter((m) => m.year >= minYear);
  }
  if (options.yearTo !== undefined) {
    const maxYear = options.yearTo;
    result = result.filter((m) => m.year <= maxYear);
  }
  return result;
}

function sortMovies(movies: RadarrMovie[], sortBy: string) {
  return [...movies].sort((a, b) => {
    switch (sortBy) {
      case "dateAdded":
        return (
          new Date(b.added ?? 0).getTime() - new Date(a.added ?? 0).getTime()
        );
      case "year":
        return (b.year || 0) - (a.year || 0);
      case "rating":
        return (b.ratings?.imdb?.value || 0) - (a.ratings?.imdb?.value || 0);
      default:
        return a.title.localeCompare(b.title);
    }
  });
}

function buildFilterDescription(options: FilterOptions) {
  const filters: string[] = [];
  if (options.genre) {
    filters.push(`genre: ${options.genre}`);
  }
  if (options.hasFile === true) {
    filters.push("downloaded only");
  }
  if (options.hasFile === false) {
    filters.push("missing files");
  }
  if (options.monitored !== undefined) {
    filters.push(options.monitored ? "monitored" : "unmonitored");
  }
  if (options.yearFrom || options.yearTo) {
    filters.push(
      `years: ${options.yearFrom ?? "any"}-${options.yearTo ?? "any"}`
    );
  }
  return filters.length > 0 ? ` (${filters.join(", ")})` : "";
}

function mapToDisplayable(movies: RadarrMovie[]): DisplayableMedia[] {
  return movies.map((movie) => ({
    title: movie.title,
    posterUrl:
      movie.remotePoster ??
      movie.images?.find((img) => img.coverType === "poster")?.remoteUrl ??
      null,
    mediaType: "movie",
    year: movie.year,
    overview: movie.overview,
    rating: movie.ratings?.imdb?.value ?? movie.ratings?.tmdb?.value,
    genres: movie.genres,
    runtime: movie.runtime,
    status: deriveMediaStatus(movie.hasFile, movie.monitored),
    hasFile: movie.hasFile,
    monitored: movie.monitored,
    serviceId: movie.id ?? 0,
    externalIds: {
      tmdb: movie.tmdbId,
      imdb: movie.imdbId,
    },
  }));
}
