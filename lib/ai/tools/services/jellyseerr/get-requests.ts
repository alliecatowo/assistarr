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
  getRequestStatusText,
  type MovieDetails,
  type RequestsResponse,
  type TvDetails,
} from "./types";

type GetRequestsProps = {
  session: Session;
};

export const getRequests = ({ session }: GetRequestsProps) =>
  tool({
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
      const userId = session.user?.id;

      if (!userId) {
        return {
          error: "You must be logged in to view requests.",
        };
      }

      try {
        const endpoint = `/request?take=${take}&skip=${skip}&filter=${filter}&sort=added`;

        const response = await jellyseerrRequest<RequestsResponse>(
          userId,
          endpoint
        );

        // Fetch additional details for each request to get titles
        const requestsWithDetails = await Promise.all(
          response.results.map(async (request) => {
            let title = "Unknown";
            let posterUrl: string | null = null;
            let year: number | undefined;

            if (request.media?.tmdbId) {
              try {
                const detailsEndpoint =
                  request.type === "movie"
                    ? `/movie/${request.media.tmdbId}`
                    : `/tv/${request.media.tmdbId}`;

                const details = await jellyseerrRequest<
                  MovieDetails | TvDetails
                >(userId, detailsEndpoint);

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
            }

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
          })
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
        if (error instanceof JellyseerrClientError) {
          return {
            error: error.message,
          };
        }
        throw error;
      }
    },
  });
