import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getServiceConfig } from "@/lib/db/queries/service-config";
import { JellyseerrClient } from "@/lib/plugins/jellyseerr/client";
import {
  type CreateRequestBody,
  getRequestStatusText,
  type MediaRequest,
  MediaStatus,
  type MovieDetails,
  type TvDetails,
} from "@/lib/plugins/jellyseerr/types";

interface RequestBody {
  tmdbId: number;
  mediaType: "movie" | "tv";
  seasons?: number[];
  is4k?: boolean;
}

function handleRequestError(error: unknown) {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("not configured") || msg.includes("disabled")) {
      return NextResponse.json({ error: msg }, { status: 503 });
    }
    if (msg.includes("409") || msg.includes("exists")) {
      return NextResponse.json(
        { error: "A request already exists for this media." },
        { status: 409 }
      );
    }
    if (msg.includes("403") || msg.includes("permission")) {
      return NextResponse.json(
        { error: "You do not have permission to request this media." },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  return NextResponse.json(
    { error: "Failed to request media" },
    { status: 500 }
  );
}

// ... other helper functions ...
function validateBody(body: Partial<RequestBody>) {
  if (!body.tmdbId || typeof body.tmdbId !== "number") {
    return "tmdbId is required and must be a number";
  }
  if (!body.mediaType || !["movie", "tv"].includes(body.mediaType)) {
    return "mediaType is required and must be 'movie' or 'tv'";
  }
  return null;
}

async function checkMediaStatus(
  client: JellyseerrClient,
  tmdbId: number,
  mediaType: "movie" | "tv"
) {
  const detailsEndpoint =
    mediaType === "movie" ? `/movie/${tmdbId}` : `/tv/${tmdbId}`;

  const details = await client.get<MovieDetails | TvDetails>(detailsEndpoint);
  const title = "title" in details ? details.title : details.name;

  if (details.mediaInfo?.status === MediaStatus.AVAILABLE) {
    return {
      status: "conflict",
      error: `"${title}" is already available in the library.`,
      title,
    };
  }

  if (
    details.mediaInfo?.status === MediaStatus.PENDING ||
    details.mediaInfo?.status === MediaStatus.PROCESSING
  ) {
    return {
      status: "conflict",
      error: `"${title}" has already been requested and is being processed.`,
      title,
    };
  }

  return { status: "ok", title };
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const validationError = validateBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { tmdbId, mediaType, seasons, is4k = false } = body;
    const userId = session.user.id;
    const config = await getServiceConfig({
      userId,
      serviceName: "jellyseerr",
    });

    if (!config?.isEnabled) {
      return NextResponse.json(
        { error: "Jellyseerr is not configured or enabled" },
        { status: 503 }
      );
    }

    const client = new JellyseerrClient(config);
    const check = await checkMediaStatus(client, tmdbId, mediaType);

    if (check.status === "conflict") {
      return NextResponse.json(
        {
          success: false,
          error: check.error,
          tmdbId,
          title: check.title,
          mediaType,
        },
        { status: 409 }
      );
    }

    const requestBody: CreateRequestBody = {
      mediaType,
      mediaId: tmdbId,
      is4k,
      seasons:
        mediaType === "tv" ? (seasons?.length ? seasons : "all") : undefined,
    };

    const mediaRequest = await client.post<MediaRequest>(
      "/request",
      requestBody
    );
    const statusText = getRequestStatusText(mediaRequest.status);

    return NextResponse.json({
      success: true,
      requestId: mediaRequest.id,
      tmdbId,
      title: check.title,
      mediaType,
      is4k: mediaRequest.is4k,
      status: statusText,
      message: `Successfully requested "${check.title}". Status: ${statusText}.`,
      ...(mediaType === "tv" && seasons && { requestedSeasons: seasons }),
    });
  } catch (error) {
    return handleRequestError(error);
  }
}
