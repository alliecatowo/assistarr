import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { JellyseerrClientError, jellyseerrRequest, getPosterUrl } from "./client";
import {
  type SearchResponse,
  type SearchResult,
  getMediaStatusText,
  getResultTitle,
  getResultYear,
  isMovieResult,
} from "./types";

type SearchContentProps = {
  session: Session;
};

export const searchContent = ({ session }: SearchContentProps) =>
  tool({
    description:
      "Search for movies or TV shows in Jellyseerr. Returns results with title, year, type, and availability/request status. Use this to find content before requesting it.",
    inputSchema: z.object({
      query: z
        .string()
        .describe("The search query (movie or TV show title)"),
      type: z
        .enum(["all", "movie", "tv"])
        .optional()
        .default("all")
        .describe("Filter by media type: 'movie', 'tv', or 'all' for both"),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .default(1)
        .describe("Page number for paginated results"),
    }),
    execute: async ({ query, type, page }) => {
      const userId = session.user?.id;

      if (!userId) {
        return {
          error: "You must be logged in to search for content.",
        };
      }

      try {
        // Determine the endpoint based on type filter
        let endpoint: string;
        if (type === "movie") {
          endpoint = `/search/movie?query=${encodeURIComponent(query)}&page=${page}`;
        } else if (type === "tv") {
          endpoint = `/search/tv?query=${encodeURIComponent(query)}&page=${page}`;
        } else {
          endpoint = `/search?query=${encodeURIComponent(query)}&page=${page}`;
        }

        const response = await jellyseerrRequest<SearchResponse>(
          userId,
          endpoint
        );

        // Transform results into a more user-friendly format
        const results = response.results.map((result: SearchResult) => {
          const title = getResultTitle(result);
          const year = getResultYear(result);
          const mediaType = result.mediaType;
          const tmdbId = result.id;

          // Determine status
          let status = "Not Requested";
          let isAvailable = false;
          let isPending = false;

          if (result.mediaInfo) {
            status = getMediaStatusText(result.mediaInfo.status);
            isAvailable = result.mediaInfo.status === 5; // AVAILABLE
            isPending = result.mediaInfo.status === 2; // PENDING
          }

          return {
            tmdbId,
            title,
            year,
            mediaType,
            overview: result.overview?.slice(0, 200) + (result.overview && result.overview.length > 200 ? "..." : ""),
            voteAverage: result.voteAverage,
            posterUrl: getPosterUrl(result.posterPath),
            status,
            isAvailable,
            isPending,
            canRequest: !isAvailable && !isPending,
          };
        });

        return {
          page: response.page,
          totalPages: response.totalPages,
          totalResults: response.totalResults,
          results,
          message:
            results.length > 0
              ? `Found ${response.totalResults} result(s) for "${query}".`
              : `No results found for "${query}".`,
        };
      } catch (error) {
        if (error instanceof JellyseerrClientError) {
          return {
            error: error.message,
          };
        }
        throw error;
      }
    },
  });
