import { tool } from "ai";
import { z } from "zod";
import { getPosterUrl } from "@/lib/utils";
import type { DisplayableMedia } from "../base";
import { ToolError } from "../core/errors";
import type { ToolFactoryProps } from "../core/types";
import { JellyseerrClient } from "./client";
import {
  getResultTitle,
  getResultYear,
  MediaStatus,
  type SearchResponse,
  type SearchResult,
} from "./types";

function mapToDisplayStatus(
  mediaInfo?: { status: number } | null
): DisplayableMedia["status"] {
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

export const searchContent = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new JellyseerrClient(config);

  return tool({
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
      try {
        const endpoint = `/search?query=${encodeURIComponent(query)}&page=${page}`;

        const response = await client.get<SearchResponse>(endpoint);

        const filteredResults = filterResultsByType(
          response.results,
          type as "all" | "movie" | "tv"
        );
        const results = mapResultsToDisplay(filteredResults);

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
        throw ToolError.fromUnknown(
          error,
          "searchContent",
          "Failed to search content"
        );
      }
    },
  });
};

function filterResultsByType(
  results: SearchResult[],
  type: "all" | "movie" | "tv"
) {
  if (type === "movie") {
    return results.filter((r) => r.mediaType === "movie");
  }
  if (type === "tv") {
    return results.filter((r) => r.mediaType === "tv");
  }
  return results;
}

function mapResultsToDisplay(results: SearchResult[]): DisplayableMedia[] {
  return results.map((result) => ({
    title: getResultTitle(result),
    posterUrl: getPosterUrl(result.posterPath),
    mediaType: result.mediaType as "movie" | "tv",
    year: getResultYear(result),
    overview:
      result.overview?.slice(0, 200) +
      (result.overview && result.overview.length > 200 ? "..." : ""),
    rating: result.voteAverage,
    status: mapToDisplayStatus(result.mediaInfo),
    externalIds: {
      tmdb: result.id,
    },
  }));
}
