import { auth } from "@/app/(auth)/auth";
import {
  getJellyseerrConfig,
  jellyseerrRequest,
} from "@/lib/ai/tools/services/jellyseerr/client";
import { radarrRequest } from "@/lib/ai/tools/services/radarr/client";
import type { RadarrMovie } from "@/lib/ai/tools/services/radarr/types";
import { sonarrRequest } from "@/lib/ai/tools/services/sonarr/client";
import type { SonarrSeries } from "@/lib/ai/tools/services/sonarr/types";
import { ChatSDKError } from "@/lib/errors";

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

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const url = new URL(request.url);
  const type = url.searchParams.get("type"); // "movie" or "series"
  const id = url.searchParams.get("id"); // tmdbId or tvdbId
  const source = url.searchParams.get("source"); // "jellyseerr" for TMDB TV lookup

  if (!type || !id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    // Jellyseerr uses TMDB for both movies and TV shows
    if (source === "jellyseerr" || (type === "movie" && !source)) {
      const jellyseerrConfig = await getJellyseerrConfig(session.user.id);

      // Try Jellyseerr first for TMDB lookups (movies and TV)
      if (jellyseerrConfig?.isEnabled) {
        const endpoint = type === "movie" ? `/movie/${id}` : `/tv/${id}`;
        try {
          const details = await jellyseerrRequest<JellyseerrMediaDetails>(
            session.user.id,
            endpoint
          );

          const title = details.title || details.name;
          const year = details.releaseDate
            ? new Date(details.releaseDate).getFullYear()
            : details.firstAirDate
              ? new Date(details.firstAirDate).getFullYear()
              : undefined;

          return Response.json({
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
          });
        } catch {
          // Fall through to Radarr/Sonarr lookup
        }
      }
    }

    // Radarr lookup for movies (TMDB)
    if (type === "movie") {
      const results = await radarrRequest<RadarrMovie[]>(
        session.user.id,
        `/movie/lookup/tmdb?tmdbId=${id}`
      );

      if (results.length === 0) {
        return Response.json({ error: "Movie not found" }, { status: 404 });
      }

      const movie = results[0];
      const posterImage = movie.images?.find(
        (img) => img.coverType === "poster"
      );

      return Response.json({
        title: movie.title,
        year: movie.year,
        overview: movie.overview,
        posterUrl: posterImage?.remoteUrl || null,
        rating: movie.ratings?.imdb?.value || movie.ratings?.tmdb?.value,
        genres: movie.genres,
        runtime: movie.runtime,
      });
    }

    // Sonarr lookup for series (TVDB)
    if (type === "series") {
      const results = await sonarrRequest<SonarrSeries[]>(
        session.user.id,
        `/series/lookup?term=tvdb:${id}`
      );

      if (results.length === 0) {
        return Response.json({ error: "Series not found" }, { status: 404 });
      }

      const series = results[0];
      const posterImage = series.images?.find(
        (img) => img.coverType === "poster"
      );

      // Calculate season count from seasons array (excluding specials/season 0)
      const seasonCount =
        series.seasons?.filter((s) => s.seasonNumber > 0).length ?? 0;

      return Response.json({
        title: series.title,
        year: series.year,
        overview: series.overview,
        posterUrl: posterImage?.remoteUrl || null,
        rating: series.ratings?.value,
        genres: series.genres,
        runtime: series.runtime,
        seasonCount,
      });
    }

    return new ChatSDKError("bad_request:api").toResponse();
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Lookup failed" },
      { status: 500 }
    );
  }
}
