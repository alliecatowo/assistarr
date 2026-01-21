import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { getPosterUrl, JellyseerrClient } from "./client";
import {
  getMediaStatusText,
  getRequestStatusText,
  type MediaRequest,
  type MovieDetails,
  type RequestsResponse,
  type TvDetails,
} from "./types";

export const getRequests = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new JellyseerrClient(config);

  return tool({
    description:
      "Get media requests from Jellyseerr. Shows pending, approved, or all requests with their status and details.",
    inputSchema: z.object({
      filter: z
        .enum([
          "all",
          "pending",
          "approved",
          "available",
          "processing",
          "unavailable",
        ])
        .optional()
        .default("all")
        .describe(
          "Filter requests by status: 'all', 'pending', 'approved', 'available', 'processing', or 'unavailable'"
        ),
      take: z
        .number()
        .int()
        .positive()
        .max(50)
        .optional()
        .default(10)
        .describe("Number of requests to return (max 50)"),
      skip: z
        .number()
        .int()
        .nonnegative()
        .optional()
        .default(0)
        .describe("Number of requests to skip for pagination"),
    }),
    execute: async ({ filter, take, skip }) => {
      try {
        const endpoint = `/request?take=${take}&skip=${skip}&filter=${filter}&sort=added`;

        const response = await client.get<RequestsResponse>(endpoint);

        const requestsWithDetails = await Promise.all(
          response.results.map((request) =>
            mapRequestToDisplay(client, request)
          )
        );

        const filterDescription = filter === "all" ? "all" : filter;

        return {
          totalRequests: response.pageInfo.results,
          totalPages: response.pageInfo.pages,
          currentPage: Math.floor(skip / take) + 1,
          requests: requestsWithDetails,
          message:
            requestsWithDetails.length > 0
              ? `Found ${response.pageInfo.results} ${filterDescription} request(s).`
              : `No ${filterDescription} requests found.`,
        };
      } catch (error) {
        return {
          requests: [],
          message: `Error getting requests: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};

async function fetchDetails(client: JellyseerrClient, request: MediaRequest) {
  let title = "Unknown";
  let posterUrl: string | null = null;
  let year: number | undefined;

  try {
    const detailsEndpoint =
      request.type === "movie"
        ? `/movie/${request.media?.tmdbId}`
        : `/tv/${request.media?.tmdbId}`;

    const details = await client.get<MovieDetails | TvDetails>(detailsEndpoint);

    title = "title" in details ? details.title : details.name;
    posterUrl = getPosterUrl(details.posterPath);

    const dateStr =
      "releaseDate" in details
        ? details.releaseDate
        : "firstAirDate" in details
          ? details.firstAirDate
          : undefined;
    if (dateStr) {
      year = new Date(dateStr).getFullYear();
    }
  } catch {
    // If we can't fetch details, continue with defaults
  }
  return { title, posterUrl, year };
}

async function mapRequestToDisplay(
  client: JellyseerrClient,
  request: MediaRequest
) {
  const { title, posterUrl, year } = request.media?.tmdbId
    ? await fetchDetails(client, request)
    : { title: "Unknown", posterUrl: null, year: undefined };

  const requestStatus = getRequestStatusText(request.status);
  const mediaStatus = request.media
    ? getMediaStatusText(request.media.status)
    : "Unknown";

  return {
    requestId: request.id,
    tmdbId: request.media?.tmdbId,
    title,
    year,
    mediaType: request.type,
    is4k: request.is4k,
    requestStatus,
    mediaStatus,
    requestedAt: request.createdAt,
    requestedBy:
      request.requestedBy?.displayName ||
      request.requestedBy?.email ||
      "Unknown",
    posterUrl,
    ...(request.type === "tv" &&
      request.seasons && {
        requestedSeasons: request.seasons,
      }),
  };
}
