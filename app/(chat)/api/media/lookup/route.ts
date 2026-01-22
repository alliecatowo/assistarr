import { auth } from "@/app/(auth)/auth";
import { getServiceConfig } from "@/lib/db/queries/service-config";
import { ChatSDKError } from "@/lib/errors";
import { JellyseerrClient } from "@/lib/plugins/jellyseerr/client";
import { RadarrClient } from "@/lib/plugins/radarr/client";
import type { RadarrMovie } from "@/lib/plugins/radarr/types";
import { SonarrClient } from "@/lib/plugins/sonarr/client";
import type { SonarrSeries } from "@/lib/plugins/sonarr/types";

interface JellyseerrMediaDetails {
  title?: string;
  name?: string;
  releaseDate?: string;
  firstAirDate?: string;
  overview?: string;
  posterPath?: string;
  voteAverage?: number;
  genres?: Array<{ name: string }>;
  runtime?: number;
  numberOfSeasons?: number;
}

interface LookupResult {
  title?: string;
  year?: number;
  overview?: string;
  posterUrl: string | null;
  rating?: number;
  genres?: string[];
  runtime?: number;
  seasonCount?: number;
}

async function lookupJellyseerr(
  userId: string,
  type: string,
  id: string
): Promise<LookupResult | null> {
  const config = await getServiceConfig({ userId, serviceName: "jellyseerr" });
  if (!config?.isEnabled) {
    return null;
  }

  try {
    const client = new JellyseerrClient(config);
    const endpoint = type === "movie" ? `/movie/${id}` : `/tv/${id}`;
    const details = await client.get<JellyseerrMediaDetails>(endpoint);

    const title = details.title || details.name;
    const year = details.releaseDate
      ? new Date(details.releaseDate).getFullYear()
      : details.firstAirDate
        ? new Date(details.firstAirDate).getFullYear()
        : undefined;

    return {
      title,
      year,
      overview: details.overview,
      posterUrl: details.posterPath
        ? `https://image.tmdb.org/t/p/w500${details.posterPath}`
        : null,
      rating: details.voteAverage,
      genres: details.genres?.map((g) => g.name),
      runtime: details.runtime,
      seasonCount: details.numberOfSeasons,
    };
  } catch {
    return null;
  }
}

async function lookupRadarr(
  userId: string,
  id: string
): Promise<LookupResult | null> {
  const config = await getServiceConfig({ userId, serviceName: "radarr" });
  if (!config?.isEnabled) {
    return null;
  }

  const client = new RadarrClient(config);
  const results = await client.get<RadarrMovie[]>(
    `/movie/lookup/tmdb?tmdbId=${id}`
  );

  if (results.length === 0) {
    return null;
  }

  const movie = results[0];
  const posterImage = movie.images?.find((img) => img.coverType === "poster");

  return {
    title: movie.title,
    year: movie.year,
    overview: movie.overview,
    posterUrl: posterImage?.remoteUrl || null,
    rating: movie.ratings?.imdb?.value || movie.ratings?.tmdb?.value,
    genres: movie.genres,
    runtime: movie.runtime,
  };
}

async function lookupSonarr(
  userId: string,
  id: string
): Promise<LookupResult | null> {
  const config = await getServiceConfig({ userId, serviceName: "sonarr" });
  if (!config?.isEnabled) {
    return null;
  }

  const client = new SonarrClient(config);
  const results = await client.get<SonarrSeries[]>(
    `/series/lookup?term=tvdb:${id}`
  );

  if (results.length === 0) {
    return null;
  }

  const series = results[0];
  const posterImage = series.images?.find((img) => img.coverType === "poster");
  const seasonCount =
    series.seasons?.filter((s) => s.seasonNumber > 0).length ?? 0;

  return {
    title: series.title,
    year: series.year,
    overview: series.overview,
    posterUrl: posterImage?.remoteUrl || null,
    rating: series.ratings?.value,
    genres: series.genres,
    runtime: series.runtime,
    seasonCount,
  };
}

async function performLookup(
  userId: string,
  type: string,
  id: string,
  source: string | null
) {
  if (source === "jellyseerr" || (type === "movie" && !source)) {
    const result = await lookupJellyseerr(userId, type, id);
    if (result) {
      return result;
    }
  }

  if (type === "movie") {
    return await lookupRadarr(userId, id);
  }

  if (type === "series") {
    return await lookupSonarr(userId, id);
  }

  return null;
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const id = url.searchParams.get("id");
  const source = url.searchParams.get("source");

  if (!type || !id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const result = await performLookup(session.user.id, type, id, source);

    if (result) {
      return Response.json(result);
    }

    return Response.json({ error: "Media not found" }, { status: 404 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Lookup failed" },
      { status: 500 }
    );
  }
}
