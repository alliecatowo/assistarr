import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { jellyseerrRequest } from "@/lib/ai/tools/services/jellyseerr/client";
import {
  type CreateRequestBody,
  getRequestStatusText,
  type MediaRequest,
  MediaStatus,
  type MovieDetails,
  type TvDetails,
} from "@/lib/ai/tools/services/jellyseerr/types";

interface RequestBody {
  tmdbId: number;
  mediaType: "movie" | "tv";
  seasons?: number[];
  is4k?: boolean;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const { tmdbId, mediaType, seasons, is4k = false } = body;

    // Validate required fields
    if (!tmdbId || typeof tmdbId !== "number") {
      return NextResponse.json(
        { error: "tmdbId is required and must be a number" },
        { status: 400 }
      );
    }

    if (!mediaType || !["movie", "tv"].includes(mediaType)) {
      return NextResponse.json(
        { error: "mediaType is required and must be 'movie' or 'tv'" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

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
      return NextResponse.json(
        {
          success: false,
          error: `"${title}" is already available in the library.`,
          tmdbId,
          title,
          mediaType,
        },
        { status: 409 }
      );
    }

    // Check if already requested/pending
    if (
      details.mediaInfo?.status === MediaStatus.PENDING ||
      details.mediaInfo?.status === MediaStatus.PROCESSING
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `"${title}" has already been requested and is being processed.`,
          tmdbId,
          title,
          mediaType,
        },
        { status: 409 }
      );
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
    const mediaRequest = await jellyseerrRequest<MediaRequest>(
      userId,
      "/request",
      {
        method: "POST",
        body: JSON.stringify(requestBody),
      }
    );

    const statusText = getRequestStatusText(mediaRequest.status);

    return NextResponse.json({
      success: true,
      requestId: mediaRequest.id,
      tmdbId,
      title,
      mediaType,
      is4k: mediaRequest.is4k,
      status: statusText,
      message: `Successfully requested "${title}". Status: ${statusText}.`,
      ...(mediaType === "tv" &&
        seasons && {
          requestedSeasons: seasons,
        }),
    });
  } catch (error) {
    if (error instanceof Error) {
      // Check if it's a configuration error
      if (
        error.message.includes("not configured") ||
        error.message.includes("disabled")
      ) {
        return NextResponse.json({ error: error.message }, { status: 503 });
      }

      // Handle specific error cases from Jellyseerr
      if (
        error.message.includes("409") ||
        error.message.includes("already exists")
      ) {
        return NextResponse.json(
          { error: "A request already exists for this media." },
          { status: 409 }
        );
      }

      if (
        error.message.includes("403") ||
        error.message.includes("permission")
      ) {
        return NextResponse.json(
          {
            error:
              "You do not have permission to request this media. You may have reached your request quota.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to request media" },
      { status: 500 }
    );
  }
}
