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
      "Get all movies currently in the Radarr library. Returns a list of all monitored and downloaded movies with their status, quality, and file info.",
    parameters: z.object({
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
    execute: async ({ sortBy, limit }) => {
      try {
        const movies = await radarrRequest<RadarrMovie[]>(
          session.user.id,
          "/movie"
        );

        // Sort movies
        const sortedMovies = [...movies].sort((a, b) => {
          switch (sortBy) {
            case "dateAdded":
              return new Date(b.added).getTime() - new Date(a.added).getTime();
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

        return {
          success: true,
          totalMovies: movies.length,
          showing: limitedMovies.length,
          movies: limitedMovies.map((movie) => ({
            id: movie.id,
            title: movie.title,
            year: movie.year,
            hasFile: movie.hasFile,
            monitored: movie.monitored,
            status: movie.status,
            qualityProfileId: movie.qualityProfileId,
            sizeOnDisk: movie.sizeOnDisk,
            runtime: movie.runtime,
          })),
        };
      } catch (error) {
        if (error instanceof RadarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to get library. Please try again." };
      }
    },
  });
