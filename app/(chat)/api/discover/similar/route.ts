import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getServiceConfig } from "@/lib/db/queries/service-config";
import { JellyseerrClient } from "@/lib/plugins/jellyseerr/client";
import { MediaStatus } from "@/lib/plugins/jellyseerr/types";

interface JellyseerrMediaResult {
  id: number;
  title?: string;
  name?: string;
  releaseDate?: string;
  firstAirDate?: string;
  mediaType?: "movie" | "tv";
  posterPath?: string;
  overview?: string;
  voteAverage?: number;
  mediaInfo?: { status: number };
}

interface JellyseerrSimilarResponse {
  results: JellyseerrMediaResult[];
}

interface JellyseerrMediaDetails {
  id: number;
  title?: string;
  name?: string;
  releaseDate?: string;
  firstAirDate?: string;
  posterPath?: string;
  backdropPath?: string;
  overview?: string;
  voteAverage?: number;
  runtime?: number;
  genres?: { id: number; name: string }[];
  credits?: {
    cast?: {
      id: number;
      name: string;
      character: string;
      profilePath?: string;
    }[];
  };
  mediaInfo?: { status: number };
  externalIds?: {
    imdbId?: string;
  };
}

function mapStatus(mediaInfo?: {
  status: number;
}): "available" | "requested" | "pending" | "unavailable" {
  if (!mediaInfo) {
    return "unavailable";
  }
  switch (mediaInfo.status) {
    case MediaStatus.AVAILABLE:
      return "available";
    case MediaStatus.PENDING:
    case MediaStatus.PROCESSING:
      return "requested";
    case MediaStatus.PARTIALLY_AVAILABLE:
      return "pending";
    default:
      return "unavailable";
  }
}

function formatDetailsResponse(
  d: JellyseerrMediaDetails,
  mediaType: "movie" | "tv"
) {
  return {
    id: d.id,
    title: d.title ?? d.name ?? "Unknown",
    year: parseYear(d.releaseDate, d.firstAirDate),
    posterUrl: d.posterPath
      ? `https://image.tmdb.org/t/p/w342${d.posterPath}`
      : null,
    backdropUrl: d.backdropPath
      ? `https://image.tmdb.org/t/p/w1280${d.backdropPath}`
      : null,
    overview: d.overview,
    rating: d.voteAverage,
    runtime: d.runtime,
    genres: d.genres?.map((g) => g.name) ?? [],
    cast:
      d.credits?.cast?.slice(0, 6).map((c) => ({
        name: c.name,
        character: c.character,
        profileUrl: c.profilePath
          ? `https://image.tmdb.org/t/p/w185${c.profilePath}`
          : null,
      })) ?? [],
    mediaType,
    tmdbId: d.id,
    status: mapStatus(d.mediaInfo),
    imdbId: d.externalIds?.imdbId,
  };
}

function formatSimilarItem(
  item: JellyseerrMediaResult,
  defaultMediaType: "movie" | "tv"
) {
  return {
    id: item.id,
    title: item.title ?? item.name ?? "Unknown",
    year: parseYear(item.releaseDate, item.firstAirDate),
    posterUrl: item.posterPath
      ? `https://image.tmdb.org/t/p/w342${item.posterPath}`
      : null,
    backdropUrl: null,
    overview: item.overview,
    rating: item.voteAverage,
    runtime: undefined,
    genres: [],
    cast: [],
    mediaType: item.mediaType ?? defaultMediaType,
    tmdbId: item.id,
    status: mapStatus(item.mediaInfo),
    imdbId: undefined,
  };
}

function parseYear(
  releaseDate?: string,
  firstAirDate?: string
): number | undefined {
  const dateStr = releaseDate?.slice(0, 4) ?? firstAirDate?.slice(0, 4);
  if (!dateStr) {
    return undefined;
  }
  const year = Number.parseInt(dateStr, 10);
  return year > 0 ? year : undefined;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tmdbId = searchParams.get("tmdbId");
  const mediaType = searchParams.get("mediaType") as "movie" | "tv";

  if (!tmdbId || !mediaType) {
    return NextResponse.json(
      { error: "tmdbId and mediaType are required" },
      { status: 400 }
    );
  }

  const jellyseerrConfig = await getServiceConfig({
    userId: session.user.id,
    serviceName: "jellyseerr",
  });

  if (!jellyseerrConfig?.isEnabled) {
    return NextResponse.json(
      { error: "Jellyseerr not configured" },
      { status: 400 }
    );
  }

  const client = new JellyseerrClient(jellyseerrConfig);

  try {
    const [detailsRes, similarRes] = await Promise.allSettled([
      client.get<JellyseerrMediaDetails>(`/${mediaType}/${tmdbId}`),
      client.get<JellyseerrSimilarResponse>(`/${mediaType}/${tmdbId}/similar`),
    ]);

    const details = buildDetailsResponse(detailsRes, mediaType);
    const similar = buildSimilarResponse(similarRes, mediaType);

    return NextResponse.json({ details, similar });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch similar content" },
      { status: 500 }
    );
  }
}

function buildDetailsResponse(
  detailsRes: PromiseSettledResult<JellyseerrMediaDetails>,
  mediaType: "movie" | "tv"
): ReturnType<typeof formatDetailsResponse> | null {
  if (detailsRes.status === "fulfilled") {
    return formatDetailsResponse(detailsRes.value, mediaType);
  }
  return null;
}

function buildSimilarResponse(
  similarRes: PromiseSettledResult<JellyseerrSimilarResponse>,
  defaultMediaType: "movie" | "tv"
): ReturnType<typeof formatSimilarItem>[] {
  if (similarRes.status === "fulfilled") {
    return similarRes.value.results
      .slice(0, 15)
      .map((item) => formatSimilarItem(item, defaultMediaType));
  }
  return [];
}
