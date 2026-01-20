import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { radarrRequest, RadarrClientError } from "./client";
import type { RadarrMovie } from "./types";

type SearchMoviesProps = {
  session: Session;
};

export const searchMovies = ({ session }: SearchMoviesProps) =>
  tool({
    description:
      "Search for movies in Radarr by name. Returns matching movies with title, year, overview, and tmdbId that can be used to add the movie to the library.",
    inputSchema: z.object({
      query: z
        .string()
        .describe("The movie name to search for (e.g., 'Inception', 'The Matrix')"),
    }),
    execute: async ({ query }) => {
      try {
        const results = await radarrRequest<RadarrMovie[]>(
          session.user.id,
          `/movie/lookup?term=${encodeURIComponent(query)}`
        );

        if (results.length === 0) {
          return {
            results: [],
            message: `No movies found matching "${query}".`,
          };
        }

        const movies = results.slice(0, 10).map((m) => ({
          title: m.title,
          year: m.year,
          overview: m.overview?.slice(0, 200) + (m.overview && m.overview.length > 200 ? "..." : ""),
          tmdbId: m.tmdbId,
          imdbId: m.imdbId,
          status: m.status,
          studio: m.studio,
          genres: m.genres,
          runtime: m.runtime,
          certification: m.certification,
          ratings: {
            imdb: m.ratings?.imdb?.value,
            tmdb: m.ratings?.tmdb?.value,
          },
          posterUrl: m.remotePoster ?? m.images.find((img) => img.coverType === "poster")?.remoteUrl,
        }));

        return {
          results: movies,
          message: `Found ${results.length} movies matching "${query}". Showing top ${movies.length} results.`,
        };
      } catch (error) {
        if (error instanceof RadarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to search for movies. Please try again." };
      }
    },
  });
