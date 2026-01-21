import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { JellyseerrClient } from "./client";
import {
  type CreateRequestBody,
  getRequestStatusText,
  type MediaRequest,
  MediaStatus,
  type MovieDetails,
  type TvDetails,
} from "./types";

/**
 * Check if media is already available or requested
 */
function checkMediaAvailability(
  details: MovieDetails | TvDetails,
  title: string,
  tmdbId: number,
  mediaType: "movie" | "tv"
) {
  if (details.mediaInfo?.status === MediaStatus.AVAILABLE) {
    return {
      success: false as const,
      error: `"${title}" is already available in the library.`,
      tmdbId,
      title,
      mediaType,
    };
  }

  if (
    details.mediaInfo?.status === MediaStatus.PENDING ||
    details.mediaInfo?.status === MediaStatus.PROCESSING
  ) {
    return {
      success: false as const,
      error: `"${title}" has already been requested and is being processed.`,
      tmdbId,
      title,
      mediaType,
    };
  }

  return null;
}

/**
 * Build the request body for Jellyseerr
 */
function buildRequestBody(
  tmdbId: number,
  mediaType: "movie" | "tv",
  seasons?: number[],
  is4k?: boolean
): CreateRequestBody {
  const requestBody: CreateRequestBody = {
    mediaType,
    mediaId: tmdbId,
    is4k,
  };

  if (mediaType === "tv") {
    requestBody.seasons = seasons && seasons.length > 0 ? seasons : "all";
  }

  return requestBody;
}

export const requestMedia = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new JellyseerrClient(config);

  return tool({
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
    execute: async ({ tmdbId, mediaType, seasons, is4k }) => {
      try {
        const detailsEndpoint =
          mediaType === "movie"
            ? `/api/v1/movie/${tmdbId}`
            : `/api/v1/tv/${tmdbId}`;

        const details = await client.get<MovieDetails | TvDetails>(
          detailsEndpoint
        );

        const title = "title" in details ? details.title : details.name;
        const availabilityError = checkMediaAvailability(
          details,
          title,
          tmdbId,
          mediaType
        );

        if (availabilityError) {
          return availabilityError;
        }

        const requestBody = buildRequestBody(tmdbId, mediaType, seasons, is4k);

        const request = await client.post<MediaRequest>(
          "/api/v1/request",
          requestBody
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
        return {
          error: `Failed to request media: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};
