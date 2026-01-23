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

interface JellyseerrSearchResult {
  id: number;
  mediaType: "movie" | "tv";
  title?: string;
  name?: string;
  releaseDate?: string;
  firstAirDate?: string;
  posterPath?: string;
  voteAverage?: number;
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

  try {
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
  } catch {
    return null;
  }
}

async function lookupSonarr(
  userId: string,
  id: string
): Promise<LookupResult | null> {
  const config = await getServiceConfig({ userId, serviceName: "sonarr" });
  if (!config?.isEnabled) {
    return null;
  }

  try {
    const client = new SonarrClient(config);
    const results = await client.get<SonarrSeries[]>(
      `/series/lookup?term=tvdb:${id}`
    );

    if (results.length === 0) {
      return null;
    }

    const series = results[0];
    const posterImage = series.images?.find(
      (img) => img.coverType === "poster"
    );
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
  } catch {
    return null;
  }
}

/**
 * Search Jellyseerr by title and return the best match
 */
async function searchJellyseerrByTitle(
  userId: string,
  type: string,
  title: string,
  year?: number
): Promise<LookupResult | null> {
  const config = await getServiceConfig({ userId, serviceName: "jellyseerr" });
  if (!config?.isEnabled) {
    return null;
  }

  try {
    const client = new JellyseerrClient(config);
    const searchQuery = encodeURIComponent(title);
    const response = await client.get<{ results: JellyseerrSearchResult[] }>(
      `/search?query=${searchQuery}&page=1`
    );

    if (!response.results || response.results.length === 0) {
      return null;
    }

    // Filter by type and find best match
    const mediaTypeFilter = type === "movie" ? "movie" : "tv";
    const matches = response.results.filter(
      (r) => r.mediaType === mediaTypeFilter
    );

    if (matches.length === 0) {
      return null;
    }

    // Try to match by year if provided
    let bestMatch = matches[0];
    if (year) {
      const yearMatch = matches.find((r) => {
        const resultYear = r.releaseDate
          ? new Date(r.releaseDate).getFullYear()
          : r.firstAirDate
            ? new Date(r.firstAirDate).getFullYear()
            : undefined;
        return resultYear === year;
      });
      if (yearMatch) {
        bestMatch = yearMatch;
      }
    }

    const resultTitle = bestMatch.title || bestMatch.name;
    const resultYear = bestMatch.releaseDate
      ? new Date(bestMatch.releaseDate).getFullYear()
      : bestMatch.firstAirDate
        ? new Date(bestMatch.firstAirDate).getFullYear()
        : undefined;

    return {
      title: resultTitle,
      year: resultYear,
      posterUrl: bestMatch.posterPath
        ? `https://image.tmdb.org/t/p/w500${bestMatch.posterPath}`
        : null,
      rating: bestMatch.voteAverage,
    };
  } catch {
    return null;
  }
}

/**
 * Search Radarr by title and return the best match
 */
async function searchRadarrByTitle(
  userId: string,
  title: string,
  year?: number
): Promise<LookupResult | null> {
  const config = await getServiceConfig({ userId, serviceName: "radarr" });
  if (!config?.isEnabled) {
    return null;
  }

  try {
    const client = new RadarrClient(config);
    const searchQuery = encodeURIComponent(title);
    const results = await client.get<RadarrMovie[]>(
      `/movie/lookup?term=${searchQuery}`
    );

    if (results.length === 0) {
      return null;
    }

    // Try to match by year if provided
    let bestMatch = results[0];
    if (year) {
      const yearMatch = results.find((r) => r.year === year);
      if (yearMatch) {
        bestMatch = yearMatch;
      }
    }

    const posterImage = bestMatch.images?.find(
      (img) => img.coverType === "poster"
    );

    return {
      title: bestMatch.title,
      year: bestMatch.year,
      overview: bestMatch.overview,
      posterUrl: posterImage?.remoteUrl || null,
      rating: bestMatch.ratings?.imdb?.value || bestMatch.ratings?.tmdb?.value,
      genres: bestMatch.genres,
      runtime: bestMatch.runtime,
    };
  } catch {
    return null;
  }
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

/**
 * Search by title when no ID is available or ID lookup fails
 */
async function _performTitleSearch(
  userId: string,
  type: string,
  title: string,
  year?: number
): Promise<LookupResult | null> {
  // Try Jellyseerr first (has TMDB data)
  const jellyseerrResult = await searchJellyseerrByTitle(
    userId,
    type,
    title,
    year
  );
  if (jellyseerrResult) {
    return jellyseerrResult;
  }

  // Fall back to Radarr for movies
  if (type === "movie") {
    return await searchRadarrByTitle(userId, title, year);
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
