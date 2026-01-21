import { tool } from "ai";
import { z } from "zod";
import type { DisplayableMedia } from "../base";
import type { ToolFactoryProps } from "../core/types";
import { getPosterUrl, JellyseerrClient } from "./client";
import { MediaStatus } from "./types";

function mapToDisplayStatus(mediaInfo?: {
  status: number;
}): DisplayableMedia["status"] {
  if (!mediaInfo) {
    return "missing";
  }
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

export const getDiscovery = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new JellyseerrClient(config);

  return tool({
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
      try {
        const endpoints: Record<string, string> = {
          trending: "/discover/trending",
          popular: "/discover/movies",
          upcoming: "/discover/movies/upcoming",
        };
        const endpoint = endpoints[type] || endpoints.trending;

        const response = await client.get<{
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
        }>(endpoint);

        if (!response.results || response.results.length === 0) {
          return {
            results: [],
            message: `No ${type} content found.`,
          };
        }

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
        return {
          results: [],
          message: `Error getting discovery content: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};
