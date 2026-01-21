import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import type { DisplayableMedia } from "../base";
import {
  getPosterUrl,
  JellyseerrClientError,
  jellyseerrRequest,
} from "./client";
import {
  getResultTitle,
  getResultYear,
  MediaStatus,
  type SearchResponse,
  type SearchResult,
} from "./types";

type SearchContentProps = {
  session: Session;
};

// Map Jellyseerr MediaStatus to DisplayableMedia status
function mapToDisplayStatus(
  mediaInfo?: { status: number } | null
): DisplayableMedia["status"] {
  if (!mediaInfo) return "missing";
  switch (mediaInfo.status) {
    case MediaStatus.AVAILABLE:
      return "available";
    case MediaStatus.PENDING:
    case MediaStatus.PROCESSING:
      return "requested";
    default:
      return "missing";
  }
}

export const searchContent = ({ session }: SearchContentProps) =>
  tool({
    description:
      "Search for movies or TV shows in Jellyseerr. Returns results with full display metadata including poster URLs. Use this to find content before requesting it.",
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

        // Map to DisplayableMedia format - services are source of truth for display data
        const results: DisplayableMedia[] = filteredResults.map(
          (result: SearchResult) => ({
            // Required display fields
            title: getResultTitle(result),
            posterUrl: getPosterUrl(result.posterPath),
            mediaType: result.mediaType as "movie" | "tv",

            // Rich metadata
            year: getResultYear(result),
            overview:
              result.overview?.slice(0, 200) +
              (result.overview && result.overview.length > 200 ? "..." : ""),
            rating: result.voteAverage,

            // Status
            status: mapToDisplayStatus(result.mediaInfo),

            // Service IDs for actions
            externalIds: {
              tmdb: result.id,
            },
          })
        );

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
