import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { JellyseerrClientError, jellyseerrRequest } from "./client";
import {
  type CreateRequestBody,
  type MediaRequest,
  type MovieDetails,
  type TvDetails,
  MediaStatus,
  getRequestStatusText,
} from "./types";

type RequestMediaProps = {
  session: Session;
};

export const requestMedia = ({ session }: RequestMediaProps) =>
  tool({
    description:
      "Request a movie or TV show to be added to the media library through Jellyseerr. Requires the TMDB ID and media type. For TV shows, you can optionally specify which seasons to request.",
    inputSchema: z.object({
      tmdbId: z
        .number()
        .int()
        .positive()
        .describe("The TMDB ID of the movie or TV show to request"),
      mediaType: z
        .enum(["movie", "tv"])
        .describe("The type of media: 'movie' or 'tv'"),
      seasons: z
        .array(z.number().int().positive())
        .optional()
        .describe(
          "For TV shows only: specific season numbers to request. If not provided, all seasons will be requested."
        ),
      is4k: z
        .boolean()
        .optional()
        .default(false)
        .describe("Request the 4K version if available"),
    }),
    needsApproval: true,
    execute: async ({ tmdbId, mediaType, seasons, is4k }) => {
      const userId = session.user?.id;

      if (!userId) {
        return {
          error: "You must be logged in to request media.",
        };
      }

      try {
        // First, check if the media already exists or is already requested
        const detailsEndpoint =
          mediaType === "movie" ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;

        const details = await jellyseerrRequest<MovieDetails | TvDetails>(
          userId,
          detailsEndpoint
        );

        const title = "title" in details ? details.title : details.name;

        // Check if already available
        if (details.mediaInfo?.status === MediaStatus.AVAILABLE) {
          return {
            success: false,
            error: `"${title}" is already available in the library.`,
            tmdbId,
            title,
            mediaType,
          };
        }

        // Check if already requested/pending
        if (
          details.mediaInfo?.status === MediaStatus.PENDING ||
          details.mediaInfo?.status === MediaStatus.PROCESSING
        ) {
          return {
            success: false,
            error: `"${title}" has already been requested and is being processed.`,
            tmdbId,
            title,
            mediaType,
          };
        }

        // Build request body
        const requestBody: CreateRequestBody = {
          mediaType,
          mediaId: tmdbId,
          is4k,
        };

        // For TV shows, add seasons
        if (mediaType === "tv") {
          if (seasons && seasons.length > 0) {
            requestBody.seasons = seasons;
          } else {
            // Request all seasons
            requestBody.seasons = "all";
          }
        }

        // Create the request
        const request = await jellyseerrRequest<MediaRequest>(
          userId,
          "/request",
          {
            method: "POST",
            body: JSON.stringify(requestBody),
          }
        );

        const statusText = getRequestStatusText(request.status);

        return {
          success: true,
          requestId: request.id,
          tmdbId,
          title,
          mediaType,
          is4k: request.is4k,
          status: statusText,
          message: `Successfully requested "${title}". Status: ${statusText}.`,
          ...(mediaType === "tv" &&
            seasons && {
              requestedSeasons: seasons,
            }),
        };
      } catch (error) {
        if (error instanceof JellyseerrClientError) {
          // Handle specific error cases
          if (error.statusCode === 409) {
            return {
              success: false,
              error: "A request already exists for this media.",
              tmdbId,
              mediaType,
            };
          }
          if (error.statusCode === 403) {
            return {
              success: false,
              error:
                "You do not have permission to request this media. You may have reached your request quota.",
              tmdbId,
              mediaType,
            };
          }
          return {
            success: false,
            error: error.message,
            tmdbId,
            mediaType,
          };
        }
        throw error;
      }
    },
  });
