import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getServiceConfig } from "@/lib/db/queries/service-config";
import { JellyseerrClient } from "@/lib/plugins/jellyseerr/client";
import { MediaStatus } from "@/lib/plugins/jellyseerr/types";
import { RadarrClient } from "@/lib/plugins/radarr/client";
import type { RadarrMovie } from "@/lib/plugins/radarr/types";
import { SonarrClient } from "@/lib/plugins/sonarr/client";
import type { SonarrSeries } from "@/lib/plugins/sonarr/types";

interface TasteProfile {
  topGenres: { genre: string; count: number; percentage: number }[];
  favoriteDecades: { decade: string; count: number; percentage: number }[];
  averageRating: number;
  totalItems: number;
  totalMovies: number;
  totalShows: number;
  totalRuntimeHours: number;
  totalSizeGB: number;
  genreDiversityScore: number;
  recentlyAdded: { title: string; genres: string[]; year: number }[];
}

interface JellyseerrDiscoverResult {
  id: number;
  title?: string;
  name?: string;
  releaseDate?: string;
  firstAirDate?: string;
  mediaType: "movie" | "tv";
  posterPath?: string;
  overview?: string;
  voteAverage?: number;
  genreIds?: number[];
  mediaInfo?: { status: number };
}

interface JellyseerrDiscoverResponse {
  results: JellyseerrDiscoverResult[];
}

// TMDB genre ID to name mapping
const TMDB_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  // TV genres
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

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

function getDecade(year: number): string {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

async function analyzeLibrary(userId: string): Promise<TasteProfile | null> {
  const [radarrConfig, sonarrConfig] = await Promise.all([
    getServiceConfig({ userId, serviceName: "radarr" }),
    getServiceConfig({ userId, serviceName: "sonarr" }),
  ]);

  const genreCounts: Record<string, number> = {};
  const decadeCounts: Record<string, number> = {};
  let totalRating = 0;
  let ratingCount = 0;
  let totalMovies = 0;
  let totalShows = 0;
  let totalRuntimeMinutes = 0;
  let totalSizeBytes = 0;
  const recentlyAdded: TasteProfile["recentlyAdded"] = [];

  // Fetch Radarr library
  if (radarrConfig?.isEnabled) {
    try {
      const client = new RadarrClient(radarrConfig);
      const movies = await client.get<RadarrMovie[]>("/movie");

      totalMovies = movies.length;

      // Sort by dateAdded to get recent items
      const sortedMovies = [...movies].sort(
        (a, b) =>
          new Date(b.added ?? 0).getTime() - new Date(a.added ?? 0).getTime()
      );

      for (const movie of movies) {
        // Count genres
        for (const genre of movie.genres ?? []) {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }

        // Count decades
        if (movie.year) {
          const decade = getDecade(movie.year);
          decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
        }

        // Track ratings
        const rating = movie.ratings?.imdb?.value ?? movie.ratings?.tmdb?.value;
        if (rating && rating > 0) {
          totalRating += rating;
          ratingCount++;
        }

        // Track runtime
        if (movie.runtime > 0) {
          totalRuntimeMinutes += movie.runtime;
        }

        // Track size
        if (movie.sizeOnDisk > 0) {
          totalSizeBytes += movie.sizeOnDisk;
        }
      }

      // Add recent movies
      for (const movie of sortedMovies.slice(0, 5)) {
        recentlyAdded.push({
          title: movie.title,
          genres: movie.genres ?? [],
          year: movie.year,
        });
      }
    } catch (_e) {
      // Radarr not available - continue without movies
    }
  }

  // Fetch Sonarr library
  if (sonarrConfig?.isEnabled) {
    try {
      const client = new SonarrClient(sonarrConfig);
      const series = await client.get<SonarrSeries[]>("/series");

      totalShows = series.length;

      const sortedSeries = [...series].sort(
        (a, b) =>
          new Date(b.added ?? 0).getTime() - new Date(a.added ?? 0).getTime()
      );

      for (const show of series) {
        // Count genres
        for (const genre of show.genres ?? []) {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }

        // Count decades
        if (show.year) {
          const decade = getDecade(show.year);
          decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
        }

        // Track ratings
        const rating = show.ratings?.value;
        if (rating && rating > 0) {
          totalRating += rating;
          ratingCount++;
        }

        // Track runtime (runtime per episode * total episodes)
        if (show.runtime > 0 && show.statistics?.episodeFileCount) {
          totalRuntimeMinutes += show.runtime * show.statistics.episodeFileCount;
        }

        // Track size
        if (show.statistics?.sizeOnDisk && show.statistics.sizeOnDisk > 0) {
          totalSizeBytes += show.statistics.sizeOnDisk;
        }
      }

      // Add recent series
      for (const show of sortedSeries.slice(0, 5)) {
        recentlyAdded.push({
          title: show.title,
          genres: show.genres ?? [],
          year: show.year,
        });
      }
    } catch (_e) {
      // Sonarr not available - continue without TV shows
    }
  }

  const totalItems = totalMovies + totalShows;
  if (totalItems === 0) {
    return null;
  }

  // Calculate genre diversity (Shannon entropy)
  const totalGenreCount = Object.values(genreCounts).reduce((a, b) => a + b, 0);
  let genreDiversityScore = 0;
  if (totalGenreCount > 0) {
    for (const count of Object.values(genreCounts)) {
      const p = count / totalGenreCount;
      genreDiversityScore -= p * Math.log2(p);
    }
    // Normalize to 0-100 scale (assuming max entropy ~3.5 for typical libraries)
    genreDiversityScore = Math.min(100, (genreDiversityScore / 3.5) * 100);
  }

  // Sort genres and decades by count with percentages
  const topGenres = Object.entries(genreCounts)
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: (count / totalGenreCount) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalDecadeCount = Object.values(decadeCounts).reduce(
    (a, b) => a + b,
    0
  );
  const favoriteDecades = Object.entries(decadeCounts)
    .map(([decade, count]) => ({
      decade,
      count,
      percentage: (count / totalDecadeCount) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    topGenres,
    favoriteDecades,
    averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
    totalItems,
    totalMovies,
    totalShows,
    totalRuntimeHours: totalRuntimeMinutes / 60,
    totalSizeGB: totalSizeBytes / (1024 ** 3),
    genreDiversityScore: Math.round(genreDiversityScore),
    recentlyAdded: recentlyAdded.slice(0, 10),
  };
}

async function getPersonalizedRecommendations(
  userId: string,
  tasteProfile: TasteProfile
) {
  const jellyseerrConfig = await getServiceConfig({
    userId,
    serviceName: "jellyseerr",
  });

  if (!jellyseerrConfig?.isEnabled) {
    return [];
  }

  const client = new JellyseerrClient(jellyseerrConfig);

  // Get recommendations based on top genres
  const topGenreNames = tasteProfile.topGenres.slice(0, 3).map((g) => g.genre);

  // Fetch trending and popular, then filter by user's preferred genres
  const [trendingRes, moviesRes, tvRes] = await Promise.allSettled([
    client.get<JellyseerrDiscoverResponse>("/discover/trending"),
    client.get<JellyseerrDiscoverResponse>("/discover/movies"),
    client.get<JellyseerrDiscoverResponse>("/discover/tv"),
  ]);

  const allResults: JellyseerrDiscoverResult[] = [];

  if (trendingRes.status === "fulfilled") {
    allResults.push(...(trendingRes.value.results || []));
  }
  if (moviesRes.status === "fulfilled") {
    allResults.push(...(moviesRes.value.results || []));
  }
  if (tvRes.status === "fulfilled") {
    allResults.push(...(tvRes.value.results || []));
  }

  // Dedupe by ID
  const seen = new Set<number>();
  const uniqueResults = allResults.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });

  // Score items based on user's taste profile
  const scoredResults = uniqueResults.map((item) => {
    let score = 0;

    // Check if item matches user's favorite genres
    const itemGenres = (item.genreIds ?? [])
      .map((id) => TMDB_GENRES[id])
      .filter(Boolean);

    for (const genre of itemGenres) {
      if (
        topGenreNames.some(
          (g) =>
            g.toLowerCase().includes(genre.toLowerCase()) ||
            genre.toLowerCase().includes(g.toLowerCase())
        )
      ) {
        score += 10;
      }
    }

    // Boost highly rated content
    if (item.voteAverage && item.voteAverage >= 7) {
      score += (item.voteAverage - 6) * 2;
    }

    // Check decade preference
    const itemYear =
      Number.parseInt(
        item.releaseDate?.slice(0, 4) ?? item.firstAirDate?.slice(0, 4) ?? "0",
        10
      ) || 0;
    if (itemYear > 0) {
      const itemDecade = getDecade(itemYear);
      const decadeMatch = tasteProfile.favoriteDecades.find(
        (d) => d.decade === itemDecade
      );
      if (decadeMatch) {
        score += 3;
      }
    }

    return { ...item, score };
  });

  // Sort by score, take top results that aren't already in library
  const sortedResults = scoredResults
    .filter((item) => item.mediaInfo?.status !== MediaStatus.AVAILABLE)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  return sortedResults.map((item) => ({
    id: item.id,
    title: item.title ?? item.name ?? "Unknown",
    year:
      Number.parseInt(
        item.releaseDate?.slice(0, 4) ?? item.firstAirDate?.slice(0, 4) ?? "0",
        10
      ) || undefined,
    posterUrl: item.posterPath
      ? `https://image.tmdb.org/t/p/w342${item.posterPath}`
      : null,
    rating: item.voteAverage,
    mediaType: item.mediaType,
    tmdbId: item.id,
    status: mapStatus(item.mediaInfo),
    reason: generateReason(item, tasteProfile, topGenreNames),
  }));
}

function generateReason(
  item: JellyseerrDiscoverResult & { score: number },
  profile: TasteProfile,
  topGenres: string[]
): string {
  const itemGenres = (item.genreIds ?? [])
    .map((id) => TMDB_GENRES[id])
    .filter(Boolean);

  const matchingGenres = itemGenres.filter((genre) =>
    topGenres.some(
      (g) =>
        g.toLowerCase().includes(genre.toLowerCase()) ||
        genre.toLowerCase().includes(g.toLowerCase())
    )
  );

  if (matchingGenres.length > 0) {
    return `Matches your love of ${matchingGenres.slice(0, 2).join(" and ")}`;
  }

  if (item.voteAverage && item.voteAverage >= 8) {
    return "Critically acclaimed and highly rated";
  }

  if (item.voteAverage && item.voteAverage >= 7) {
    return "Well-reviewed and popular";
  }

  return "Trending and recommended";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tasteProfile = await analyzeLibrary(session.user.id);

    if (!tasteProfile) {
      return NextResponse.json({
        recommendations: [],
        profile: null,
        message:
          "Add some content to your library to get personalized recommendations",
      });
    }

    const recommendations = await getPersonalizedRecommendations(
      session.user.id,
      tasteProfile
    );

    return NextResponse.json({
      recommendations,
      profile: {
        topGenres: tasteProfile.topGenres.slice(0, 5),
        favoriteDecades: tasteProfile.favoriteDecades.slice(0, 3),
        totalItems: tasteProfile.totalItems,
        totalMovies: tasteProfile.totalMovies,
        totalShows: tasteProfile.totalShows,
        totalRuntimeHours: Math.round(tasteProfile.totalRuntimeHours),
        totalSizeGB: Math.round(tasteProfile.totalSizeGB * 10) / 10,
        averageRating: Math.round(tasteProfile.averageRating * 10) / 10,
        genreDiversityScore: tasteProfile.genreDiversityScore,
      },
      message:
        recommendations.length > 0
          ? `Based on your ${tasteProfile.totalItems} items`
          : "No new recommendations found",
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
