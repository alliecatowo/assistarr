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

function mergeGenreCounts(
  target: Record<string, number>,
  source: Record<string, number>
): void {
  for (const [genre, count] of Object.entries(source)) {
    target[genre] = (target[genre] || 0) + count;
  }
}

function mergeDecadeCounts(
  target: Record<string, number>,
  source: Record<string, number>
): void {
  for (const [decade, count] of Object.entries(source)) {
    target[decade] = (target[decade] || 0) + count;
  }
}

function processMovieGenres(
  movie: RadarrMovie,
  genreCounts: Record<string, number>
): void {
  for (const genre of movie.genres ?? []) {
    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
  }
}

function processMovieDecade(
  movie: RadarrMovie,
  decadeCounts: Record<string, number>
): void {
  if (movie.year) {
    const decade = getDecade(movie.year);
    decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
  }
}

function processMovieRating(movie: RadarrMovie): {
  totalRating: number;
  ratingCount: number;
} {
  const rating = movie.ratings?.imdb?.value ?? movie.ratings?.tmdb?.value;
  if (rating && rating > 0) {
    return { totalRating: rating, ratingCount: 1 };
  }
  return { totalRating: 0, ratingCount: 0 };
}

function processMovies(movies: RadarrMovie[]): {
  genreCounts: Record<string, number>;
  decadeCounts: Record<string, number>;
  totalRating: number;
  ratingCount: number;
  totalRuntimeMinutes: number;
  totalSizeBytes: number;
  recentlyAdded: TasteProfile["recentlyAdded"];
} {
  const genreCounts: Record<string, number> = {};
  const decadeCounts: Record<string, number> = {};
  let totalRating = 0;
  let ratingCount = 0;
  let totalRuntimeMinutes = 0;
  let totalSizeBytes = 0;
  const recentlyAdded: TasteProfile["recentlyAdded"] = [];

  const sortedMovies = [...movies].sort(
    (a, b) =>
      new Date(b.added ?? 0).getTime() - new Date(a.added ?? 0).getTime()
  );

  for (const movie of movies) {
    processMovieGenres(movie, genreCounts);
    processMovieDecade(movie, decadeCounts);

    const ratingData = processMovieRating(movie);
    totalRating += ratingData.totalRating;
    ratingCount += ratingData.ratingCount;

    if (movie.runtime > 0) {
      totalRuntimeMinutes += movie.runtime;
    }

    if (movie.sizeOnDisk > 0) {
      totalSizeBytes += movie.sizeOnDisk;
    }
  }

  for (const movie of sortedMovies.slice(0, 5)) {
    recentlyAdded.push({
      title: movie.title,
      genres: movie.genres ?? [],
      year: movie.year,
    });
  }

  return {
    genreCounts,
    decadeCounts,
    totalRating,
    ratingCount,
    totalRuntimeMinutes,
    totalSizeBytes,
    recentlyAdded,
  };
}

function processSeriesGenres(
  series: SonarrSeries,
  genreCounts: Record<string, number>
): void {
  for (const genre of series.genres ?? []) {
    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
  }
}

function processSeriesDecade(
  series: SonarrSeries,
  decadeCounts: Record<string, number>
): void {
  if (series.year) {
    const decade = getDecade(series.year);
    decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
  }
}

function processSeriesRating(series: SonarrSeries): {
  totalRating: number;
  ratingCount: number;
} {
  const rating = series.ratings?.value;
  if (rating && rating > 0) {
    return { totalRating: rating, ratingCount: 1 };
  }
  return { totalRating: 0, ratingCount: 0 };
}

function processSeriesRuntime(series: SonarrSeries): number {
  if (series.runtime > 0 && series.statistics?.episodeFileCount) {
    return series.runtime * series.statistics.episodeFileCount;
  }
  return 0;
}

function processSeriesSize(series: SonarrSeries): number {
  if (series.statistics?.sizeOnDisk && series.statistics.sizeOnDisk > 0) {
    return series.statistics.sizeOnDisk;
  }
  return 0;
}

function processSeries(series: SonarrSeries[]): {
  genreCounts: Record<string, number>;
  decadeCounts: Record<string, number>;
  totalRating: number;
  ratingCount: number;
  totalRuntimeMinutes: number;
  totalSizeBytes: number;
  recentlyAdded: TasteProfile["recentlyAdded"];
} {
  const genreCounts: Record<string, number> = {};
  const decadeCounts: Record<string, number> = {};
  let totalRating = 0;
  let ratingCount = 0;
  let totalRuntimeMinutes = 0;
  let totalSizeBytes = 0;
  const recentlyAdded: TasteProfile["recentlyAdded"] = [];

  const sortedSeries = [...series].sort(
    (a, b) =>
      new Date(b.added ?? 0).getTime() - new Date(a.added ?? 0).getTime()
  );

  for (const show of series) {
    processSeriesGenres(show, genreCounts);
    processSeriesDecade(show, decadeCounts);

    const ratingData = processSeriesRating(show);
    totalRating += ratingData.totalRating;
    ratingCount += ratingData.ratingCount;

    totalRuntimeMinutes += processSeriesRuntime(show);
    totalSizeBytes += processSeriesSize(show);
  }

  for (const show of sortedSeries.slice(0, 5)) {
    recentlyAdded.push({
      title: show.title,
      genres: show.genres ?? [],
      year: show.year,
    });
  }

  return {
    genreCounts,
    decadeCounts,
    totalRating,
    ratingCount,
    totalRuntimeMinutes,
    totalSizeBytes,
    recentlyAdded,
  };
}

function calculateGenreDiversity(genreCounts: Record<string, number>): number {
  const totalGenreCount = Object.values(genreCounts).reduce((a, b) => a + b, 0);
  let genreDiversityScore = 0;
  if (totalGenreCount > 0) {
    for (const count of Object.values(genreCounts)) {
      const p = count / totalGenreCount;
      genreDiversityScore -= p * Math.log2(p);
    }
    genreDiversityScore = Math.min(100, (genreDiversityScore / 3.5) * 100);
  }
  return Math.round(genreDiversityScore);
}

function buildTopGenres(genreCounts: Record<string, number>) {
  const totalGenreCount = Object.values(genreCounts).reduce((a, b) => a + b, 0);
  return Object.entries(genreCounts)
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: (count / totalGenreCount) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function buildFavoriteDecades(decadeCounts: Record<string, number>) {
  const totalDecadeCount = Object.values(decadeCounts).reduce(
    (a, b) => a + b,
    0
  );
  return Object.entries(decadeCounts)
    .map(([decade, count]) => ({
      decade,
      count,
      percentage: (count / totalDecadeCount) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
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
  let totalRuntimeMinutes = 0;
  let totalSizeBytes = 0;
  const recentlyAdded: TasteProfile["recentlyAdded"] = [];
  let totalMovies = 0;
  let totalShows = 0;

  if (radarrConfig?.isEnabled) {
    try {
      const client = new RadarrClient(radarrConfig);
      const movies = await client.get<RadarrMovie[]>("/movie");
      totalMovies = movies.length;
      const movieData = processMovies(movies);
      mergeGenreCounts(genreCounts, movieData.genreCounts);
      mergeDecadeCounts(decadeCounts, movieData.decadeCounts);
      totalRating += movieData.totalRating;
      ratingCount += movieData.ratingCount;
      totalRuntimeMinutes += movieData.totalRuntimeMinutes;
      totalSizeBytes += movieData.totalSizeBytes;
      recentlyAdded.push(...movieData.recentlyAdded);
    } catch (_e) {
      // Radarr not available - continue without movies
    }
  }

  if (sonarrConfig?.isEnabled) {
    try {
      const client = new SonarrClient(sonarrConfig);
      const series = await client.get<SonarrSeries[]>("/series");
      totalShows = series.length;
      const seriesData = processSeries(series);
      mergeGenreCounts(genreCounts, seriesData.genreCounts);
      mergeDecadeCounts(decadeCounts, seriesData.decadeCounts);
      totalRating += seriesData.totalRating;
      ratingCount += seriesData.ratingCount;
      totalRuntimeMinutes += seriesData.totalRuntimeMinutes;
      totalSizeBytes += seriesData.totalSizeBytes;
      recentlyAdded.push(...seriesData.recentlyAdded);
    } catch (_e) {
      // Sonarr not available - continue without TV shows
    }
  }

  const totalItems = totalMovies + totalShows;
  if (totalItems === 0) {
    return null;
  }

  const genreDiversityScore = calculateGenreDiversity(genreCounts);
  const topGenres = buildTopGenres(genreCounts);
  const favoriteDecades = buildFavoriteDecades(decadeCounts);

  return {
    topGenres,
    favoriteDecades,
    averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
    totalItems,
    totalMovies,
    totalShows,
    totalRuntimeHours: totalRuntimeMinutes / 60,
    totalSizeGB: totalSizeBytes / 1024 ** 3,
    genreDiversityScore,
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

  const topGenreNames = tasteProfile.topGenres.slice(0, 3).map((g) => g.genre);

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

  const seen = new Set<number>();
  const uniqueResults = allResults.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });

  function calculateGenreScore(itemGenres: string[]): number {
    let genreScore = 0;
    for (const genre of itemGenres) {
      if (
        topGenreNames.some(
          (g) =>
            g.toLowerCase().includes(genre.toLowerCase()) ||
            genre.toLowerCase().includes(g.toLowerCase())
        )
      ) {
        genreScore += 10;
      }
    }
    return genreScore;
  }

  function calculateDecadeScore(itemYear: number): number {
    if (itemYear <= 0) {
      return 0;
    }
    const itemDecade = getDecade(itemYear);
    const decadeMatch = tasteProfile.favoriteDecades.find(
      (d) => d.decade === itemDecade
    );
    return decadeMatch ? 3 : 0;
  }

  const scoredResults = uniqueResults.map((item) => {
    let score = 0;

    const itemGenres = (item.genreIds ?? [])
      .map((id) => TMDB_GENRES[id])
      .filter(Boolean);

    score += calculateGenreScore(itemGenres);

    if (item.voteAverage && item.voteAverage >= 7) {
      score += (item.voteAverage - 6) * 2;
    }

    const itemYear =
      Number.parseInt(
        item.releaseDate?.slice(0, 4) ?? item.firstAirDate?.slice(0, 4) ?? "0",
        10
      ) || 0;
    score += calculateDecadeScore(itemYear);

    return { ...item, score };
  });

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
  _profile: TasteProfile,
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
