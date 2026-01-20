import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import {
  getPosterUrl,
  JellyseerrClientError,
  jellyseerrRequest,
} from "./client";
import {
  getMediaStatusText,
  getResultTitle,
  getResultYear,
  type SearchResponse,
  type SearchResult,
} from "./types";

type SearchContentProps = {
  session: Session;
};

export const searchContent = ({ session }: SearchContentProps) =>
  tool({
    description:
      "Search for movies or TV shows in Jellyseerr. Returns results with title, year, type, and availability/request status. Use this to find content before requesting it.",
    inputSchema: z.object({
      query: z.string().describe("The search query (movie or TV show title)"),
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
        // Jellyseerr uses a single /search endpoint - filter results client-side
        const endpoint = `/search?query=${encodeURIComponent(query)}&page=${page}`;

        const response = await jellyseerrRequest<SearchResponse>(
          userId,
          endpoint
        );

        // Filter results by type if specified
        let filteredResults = response.results;
        if (type === "movie") {
          filteredResults = response.results.filter(
            (r: SearchResult) => r.mediaType === "movie"
          );
        } else if (type === "tv") {
          filteredResults = response.results.filter(
            (r: SearchResult) => r.mediaType === "tv"
          );
        }

        // Transform results into a more user-friendly format
        const results = filteredResults.map((result: SearchResult) => {
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
            overview:
              result.overview?.slice(0, 200) +
              (result.overview && result.overview.length > 200 ? "..." : ""),
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
          totalResults: results.length,
          results,
          message:
            results.length > 0
              ? `Found ${results.length} result(s) for "${query}"${type !== "all" ? ` (filtered by ${type})` : ""}.`
              : `No results found for "${query}"${type !== "all" ? ` (filtered by ${type})` : ""}.`,
        };
      } catch (error) {
        if (error instanceof JellyseerrClientError) {
          console.error(`[Jellyseerr] Search failed: ${error.message}`, {
            statusCode: error.statusCode,
            query,
            type,
          });
          return {
            error: error.message,
          };
        }
        console.error("[Jellyseerr] Unexpected error during search:", error);
        throw error;
      }
    },
  });
