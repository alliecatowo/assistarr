import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import type { DisplayableMedia } from "../base";
import {
  getPosterUrl,
  JellyseerrClientError,
  jellyseerrRequest,
} from "./client";
import { getMediaStatusText, MediaStatus } from "./types";

type GetDiscoveryProps = {
  session: Session;
};

// Map Jellyseerr MediaStatus to DisplayableMedia status
function mapToDisplayStatus(
  mediaInfo?: { status: number }
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

export const getDiscovery = ({ session }: GetDiscoveryProps) =>
  tool({
    description:
      "Get trending and popular movies and TV shows from Jellyseerr. Use this to discover new content to recommend to the user.",
    inputSchema: z.object({
      type: z
        .enum(["trending", "popular", "upcoming"])
        .optional()
        .default("trending")
        .describe("The type of discovery content to retrieve"),
    }),
    execute: async ({ type }) => {
      const userId = session.user?.id;
      if (!userId) {
        return { error: "You must be logged in to view discovery content." };
      }

      try {
        // Jellyseerr discovery endpoints
        const endpoints: Record<string, string> = {
          trending: "/discover/trending",
          popular: "/discover/movies",
          upcoming: "/discover/movies/upcoming",
        };
        const endpoint = endpoints[type] || endpoints.trending;

        const response = await jellyseerrRequest<{
          results: Array<{
            id: number;
            title?: string;
            name?: string;
            releaseDate?: string;
            firstAirDate?: string;
            mediaType: "movie" | "tv";
            posterPath?: string;
            overview?: string;
            voteAverage?: number;
            mediaInfo?: { status: number };
          }>;
        }>(userId, endpoint);

        if (!response.results || response.results.length === 0) {
          return {
            results: [],
            message: `No ${type} content found.`,
          };
        }

        // Map to DisplayableMedia format
        const results: DisplayableMedia[] = response.results
          .slice(0, 10)
          .map((result) => ({
            title: result.title || result.name || "Unknown",
            posterUrl: getPosterUrl(result.posterPath),
            mediaType: result.mediaType as "movie" | "tv",
            year: result.releaseDate
              ? new Date(result.releaseDate).getFullYear()
              : result.firstAirDate
                ? new Date(result.firstAirDate).getFullYear()
                : undefined,
            overview: result.overview?.slice(0, 200),
            rating: result.voteAverage,
            status: mapToDisplayStatus(result.mediaInfo),
            externalIds: {
              tmdb: result.id,
            },
          }));

        return {
          results,
          message: `Found ${results.length} ${type} items.`,
        };
      } catch (error) {
        if (error instanceof JellyseerrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to get discovery content. Please try again." };
      }
    },
  });
