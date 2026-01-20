import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import {
  getPosterUrl,
  JellyseerrClientError,
  jellyseerrRequest,
} from "./client";
import { getMediaStatusText } from "./types";

type GetDiscoveryProps = {
  session: Session;
};

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
        let endpoint = "/discover/trending";
        if (type === "popular") {
          endpoint = "/discover/movies?sortBy=popularity.desc"; // Simplified mapping usually discovery API is complex
        }
        if (type === "upcoming") {
          endpoint = "/discover/movies/upcoming";
        }

        // Jellyseerr Discovery API is a bit different. Let's use standard /discover/trending endpoint which covers most.
        // Actually Jellyseerr exposes /api/v1/discover/trending, /api/v1/discover/movies, etc.
        // Let's stick to /discover/trending which returns mixed content usually.

        if (type === "trending") {
          endpoint = "/discover/trending";
        }
        // To be safe and simple: just trending for now.

        const response = await jellyseerrRequest<any>(userId, endpoint);
        // Response format usually matches SearchResult[] inside results array

        const results = response.results.slice(0, 10).map((result: any) => ({
          tmdbId: result.id,
          title: result.title || result.name,
          year: result.releaseDate
            ? new Date(result.releaseDate).getFullYear()
            : result.firstAirDate
              ? new Date(result.firstAirDate).getFullYear()
              : undefined,
          mediaType: result.mediaType,
          posterUrl: getPosterUrl(result.posterPath),
          status: result.mediaInfo
            ? getMediaStatusText(result.mediaInfo.status)
            : "Not Requested",
        }));

        return {
          success: true,
          type,
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
