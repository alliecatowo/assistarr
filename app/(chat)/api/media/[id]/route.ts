import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getServiceConfig } from "@/lib/db/queries/service-config";
import { JellyseerrClient } from "@/lib/plugins/jellyseerr/client";

interface MediaDetails {
  id: number;
  title: string;
  year?: number;
  overview?: string;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  rating?: number;
  runtime?: number;
  genres?: string[];
  mediaType: "movie" | "tv";
  status?: string;
  isAvailable?: boolean;
  isPending?: boolean;
}

interface JellyseerrMovieDetails {
  id: number;
  title: string;
  releaseDate?: string;
  overview?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  voteAverage?: number;
  runtime?: number;
  genres?: { id: number; name: string }[];
  mediaInfo?: {
    status?: number;
    downloadStatus?: unknown[];
  };
}

interface JellyseerrTvDetails {
  id: number;
  name: string;
  firstAirDate?: string;
  overview?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  voteAverage?: number;
  episodeRunTime?: number[];
  genres?: { id: number; name: string }[];
  mediaInfo?: {
    status?: number;
    downloadStatus?: unknown[];
  };
}

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

function getPosterUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  return `${TMDB_IMAGE_BASE}/w342${path}`;
}

function getBackdropUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  return `${TMDB_IMAGE_BASE}/w780${path}`;
}

function parseYear(dateString?: string): number | undefined {
  if (!dateString) {
    return undefined;
  }
  const year = Number.parseInt(dateString.split("-")[0], 10);
  return Number.isNaN(year) ? undefined : year;
}

// Jellyseerr status codes: 1 = Unknown, 2 = Pending, 3 = Processing, 4 = Partially Available, 5 = Available
function getAvailabilityStatus(status?: number): {
  isAvailable: boolean;
  isPending: boolean;
} {
  if (status === 5 || status === 4) {
    return { isAvailable: true, isPending: false };
  }
  if (status === 2 || status === 3) {
    return { isAvailable: false, isPending: true };
  }
  return { isAvailable: false, isPending: false };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(request.url);
    const mediaType = url.searchParams.get("type") || "movie";

    if (!["movie", "tv"].includes(mediaType)) {
      return NextResponse.json(
        { error: "Invalid media type. Must be 'movie' or 'tv'" },
        { status: 400 }
      );
    }

    const config = await getServiceConfig({
      userId: session.user.id,
      serviceName: "jellyseerr",
    });

    if (!config || !config.isEnabled) {
      return NextResponse.json(
        { error: "Jellyseerr is not configured or enabled" },
        { status: 503 }
      );
    }

    const client = new JellyseerrClient(config);
    const endpoint = mediaType === "movie" ? `/movie/${id}` : `/tv/${id}`;

    if (mediaType === "movie") {
      const data = await client.get<JellyseerrMovieDetails>(endpoint);
      const { isAvailable, isPending } = getAvailabilityStatus(
        data.mediaInfo?.status
      );

      const result: MediaDetails = {
        id: data.id,
        title: data.title,
        year: parseYear(data.releaseDate),
        overview: data.overview,
        posterUrl: getPosterUrl(data.posterPath),
        backdropUrl: getBackdropUrl(data.backdropPath),
        rating: data.voteAverage,
        runtime: data.runtime,
        genres: data.genres?.map((g) => g.name),
        mediaType: "movie",
        isAvailable,
        isPending,
      };

      return NextResponse.json(result);
    }
    const data = await client.get<JellyseerrTvDetails>(endpoint);

    const { isAvailable, isPending } = getAvailabilityStatus(
      data.mediaInfo?.status
    );

    const result: MediaDetails = {
      id: data.id,
      title: data.name,
      year: parseYear(data.firstAirDate),
      overview: data.overview,
      posterUrl: getPosterUrl(data.posterPath),
      backdropUrl: getBackdropUrl(data.backdropPath),
      rating: data.voteAverage,
      runtime: data.episodeRunTime?.[0],
      genres: data.genres?.map((g) => g.name),
      mediaType: "tv",
      isAvailable,
      isPending,
    };

    return NextResponse.json(result);
  } catch (error) {
    // Check if it's a configuration error
    if (
      error instanceof Error &&
      (error.message.includes("not configured") ||
        error.message.includes("disabled"))
    ) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json(
      { error: "Failed to fetch media details" },
      { status: 500 }
    );
  }
}
