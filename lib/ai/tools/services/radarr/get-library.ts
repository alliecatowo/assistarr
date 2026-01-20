import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { RadarrClientError, radarrRequest } from "./client";
import type { RadarrMovie } from "./types";

type GetLibraryProps = {
  session: Session;
};

export const getLibrary = ({ session }: GetLibraryProps) =>
  tool({
    description:
      "Get movies from the Radarr library with filtering. Use genre filter for 'comedy movies', 'action films', etc. Use hasFile filter to show only downloaded movies ready to watch.",
    inputSchema: z.object({
      genre: z
        .string()
        .optional()
        .describe(
          "Filter by genre (e.g., 'Comedy', 'Action', 'Horror', 'Drama', 'Sci-Fi'). Case-insensitive partial match."
        ),
      hasFile: z
        .boolean()
        .optional()
        .describe(
          "Filter to only movies with downloaded files (true) or missing files (false)"
        ),
      monitored: z.boolean().optional().describe("Filter by monitored status"),
      yearFrom: z
        .number()
        .optional()
        .describe("Filter movies from this year onwards (e.g., 2020)"),
      yearTo: z
        .number()
        .optional()
        .describe("Filter movies up to this year (e.g., 2024)"),
      sortBy: z
        .enum(["title", "dateAdded", "year", "rating"])
        .optional()
        .default("title")
        .describe("How to sort the results"),
      limit: z
        .number()
        .optional()
        .default(50)
        .describe("Maximum number of movies to return (default 50)"),
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
        const movies = await radarrRequest<RadarrMovie[]>(
          session.user.id,
          "/movie"
        );

        // Apply filters
        let filteredMovies = movies;

        if (genre) {
          const genreLower = genre.toLowerCase();
          filteredMovies = filteredMovies.filter((m) =>
            m.genres?.some((g) => g.toLowerCase().includes(genreLower))
          );
        }

        if (hasFile !== undefined) {
          filteredMovies = filteredMovies.filter((m) => m.hasFile === hasFile);
        }

        if (monitored !== undefined) {
          filteredMovies = filteredMovies.filter(
            (m) => m.monitored === monitored
          );
        }

        if (yearFrom !== undefined) {
          filteredMovies = filteredMovies.filter((m) => m.year >= yearFrom);
        }

        if (yearTo !== undefined) {
          filteredMovies = filteredMovies.filter((m) => m.year <= yearTo);
        }

        // Sort movies
        const sortedMovies = [...filteredMovies].sort((a, b) => {
          switch (sortBy) {
            case "dateAdded":
              return (
                new Date(b.added ?? 0).getTime() -
                new Date(a.added ?? 0).getTime()
              );
            case "year":
              return (b.year || 0) - (a.year || 0);
            case "rating":
              return (
                (b.ratings?.imdb?.value || 0) - (a.ratings?.imdb?.value || 0)
              );
            default:
              return a.title.localeCompare(b.title);
          }
        });

        // Limit results
        const limitedMovies = sortedMovies.slice(0, limit);

        // Build filter description for message
        const filters: string[] = [];
        if (genre) {
          filters.push(`genre: ${genre}`);
        }
        if (hasFile === true) {
          filters.push("downloaded only");
        }
        if (hasFile === false) {
          filters.push("missing files");
        }
        if (monitored !== undefined) {
          filters.push(monitored ? "monitored" : "unmonitored");
        }
        if (yearFrom || yearTo) {
          filters.push(`years: ${yearFrom ?? "any"}-${yearTo ?? "any"}`);
        }
        const filterDesc = filters.length > 0 ? ` (${filters.join(", ")})` : "";

        return {
          results: limitedMovies.map((movie) => ({
            id: movie.id,
            tmdbId: movie.tmdbId,
            imdbId: movie.imdbId,
            title: movie.title,
            year: movie.year,
            overview: movie.overview,
            mediaType: "movie" as const,
            posterUrl:
              movie.remotePoster ??
              movie.images?.find((img) => img.coverType === "poster")
                ?.remoteUrl,
            rating: movie.ratings?.imdb?.value ?? movie.ratings?.tmdb?.value,
            genres: movie.genres,
            runtime: movie.runtime,
            hasFile: movie.hasFile,
            monitored: movie.monitored,
            status: movie.status,
            sizeOnDisk: movie.sizeOnDisk,
            qualityProfileId: movie.qualityProfileId,
          })),
          totalInLibrary: movies.length,
          totalMatching: filteredMovies.length,
          showing: limitedMovies.length,
          message:
            filteredMovies.length > 0
              ? `Found ${filteredMovies.length} movie(s)${filterDesc}. Showing ${limitedMovies.length}.`
              : `No movies found${filterDesc}.`,
        };
      } catch (error) {
        if (error instanceof RadarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to get library. Please try again." };
      }
    },
  });
