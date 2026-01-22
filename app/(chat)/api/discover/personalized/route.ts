import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getServiceConfig } from "@/lib/db/queries/service-config";
import { JellyseerrClient } from "@/lib/plugins/jellyseerr/client";
import { MediaStatus } from "@/lib/plugins/jellyseerr/types";
import { RadarrClient } from "@/lib/plugins/radarr/client";
import type { RadarrMovie } from "@/lib/plugins/radarr/types";
import { SonarrClient } from "@/lib/plugins/sonarr/client";
import type { SonarrSeries } from "@/lib/plugins/sonarr/types";

// =============================================================================
// Type Definitions
// =============================================================================

interface PersonCount {
  id: number;
  name: string;
  count: number;
  profilePath?: string;
}

interface GenreCount {
  genre: string;
  count: number;
  percentage?: number;
}

interface DecadeCount {
  decade: string;
  count: number;
  percentage?: number;
}

interface StudioCount {
  studio: string;
  count: number;
}

interface NetworkCount {
  network: string;
  count: number;
}

interface RecentItem {
  title: string;
  tmdbId: number;
  year: number;
  genres: string[];
  mediaType: "movie" | "tv";
}

interface DeepTasteProfile {
  topGenres: GenreCount[];
  favoriteDirectors: PersonCount[];
  favoriteActors: PersonCount[];
  favoriteDecades: DecadeCount[];
  favoriteStudios: StudioCount[];
  favoriteNetworks: NetworkCount[];
  recentlyAdded: RecentItem[];
  totalMovies: number;
  totalShows: number;
  averageRating: number;
  totalRuntimeHours: number;
  totalSizeGB: number;
  genreDiversityScore: number;
  prefersMovies: boolean;
  prefersTv: boolean;
  topYears: { year: number; count: number }[];
}

interface JellyseerrDiscoverResult {
  id: number;
  title?: string;
  name?: string;
  releaseDate?: string;
  firstAirDate?: string;
  mediaType: "movie" | "tv";
  posterPath?: string;
  backdropPath?: string;
  overview?: string;
  voteAverage?: number;
  genreIds?: number[];
  mediaInfo?: { status: number };
}

interface JellyseerrDiscoverResponse {
  results: JellyseerrDiscoverResult[];
  page?: number;
  totalPages?: number;
  totalResults?: number;
}

interface JellyseerrPersonCredits {
  id: number;
  name: string;
  profilePath?: string;
  cast?: JellyseerrDiscoverResult[];
  crew?: (JellyseerrDiscoverResult & { job?: string })[];
}

interface JellyseerrMovieDetails {
  id: number;
  title: string;
  releaseDate?: string;
  genres?: { id: number; name: string }[];
  credits?: {
    cast?: { id: number; name: string; profilePath?: string; order?: number }[];
    crew?: { id: number; name: string; job?: string; profilePath?: string }[];
  };
  productionCompanies?: { id: number; name: string }[];
}

interface PersonalizedSection {
  id: string;
  title: string;
  subtitle?: string;
  reason: string;
  items: PersonalizedItem[];
  type: PersonalizedSectionType;
}

interface PersonalizedItem {
  id: number;
  title: string;
  year?: number;
  posterUrl: string | null;
  rating?: number;
  mediaType: "movie" | "tv";
  tmdbId: number;
  status: "available" | "requested" | "pending" | "unavailable";
  reason?: string;
}

type PersonalizedSectionType =
  | "director"
  | "actor"
  | "genre"
  | "decade"
  | "similar"
  | "new-releases"
  | "hidden-gems"
  | "critically-acclaimed"
  | "studio"
  | "network";

// =============================================================================
// Constants
// =============================================================================

const GENRE_TO_ID: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10_751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10_402,
  mystery: 9648,
  romance: 10_749,
  "science fiction": 878,
  "sci-fi": 878,
  thriller: 53,
  war: 10_752,
  western: 37,
};

// =============================================================================
// Helper Functions
// =============================================================================

function getDecade(year: number): string {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
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

function parseYear(dateStr?: string): number | undefined {
  if (!dateStr) {
    return undefined;
  }
  const year = Number.parseInt(dateStr.slice(0, 4), 10);
  return year > 0 ? year : undefined;
}

function mapResultToItem(
  result: JellyseerrDiscoverResult,
  reason?: string
): PersonalizedItem {
  return {
    id: result.id,
    title: result.title ?? result.name ?? "Unknown",
    year: parseYear(result.releaseDate ?? result.firstAirDate),
    posterUrl: result.posterPath
      ? `https://image.tmdb.org/t/p/w342${result.posterPath}`
      : null,
    rating: result.voteAverage,
    mediaType: result.mediaType,
    tmdbId: result.id,
    status: mapStatus(result.mediaInfo),
    reason,
  };
}

interface LibraryMetrics {
  genreCounts: Record<string, number>;
  decadeCounts: Record<string, number>;
  yearCounts: Record<number, number>;
  studioCounts: Record<string, number>;
  networkCounts: Record<string, number>;
  totalRating: number;
  ratingCount: number;
  totalRuntimeMinutes: number;
  totalSizeBytes: number;
  recentlyAdded: RecentItem[];
  tmdbIds: { tmdbId: number; mediaType: "movie" | "tv" }[];
}

function initializeMetrics(): LibraryMetrics {
  return {
    genreCounts: {},
    decadeCounts: {},
    yearCounts: {},
    studioCounts: {},
    networkCounts: {},
    totalRating: 0,
    ratingCount: 0,
    totalRuntimeMinutes: 0,
    totalSizeBytes: 0,
    recentlyAdded: [],
    tmdbIds: [],
  };
}

function processMovie(movie: RadarrMovie, metrics: LibraryMetrics): void {
  for (const genre of movie.genres ?? []) {
    metrics.genreCounts[genre] = (metrics.genreCounts[genre] || 0) + 1;
  }

  if (movie.year) {
    const decade = getDecade(movie.year);
    metrics.decadeCounts[decade] = (metrics.decadeCounts[decade] || 0) + 1;
    metrics.yearCounts[movie.year] = (metrics.yearCounts[movie.year] || 0) + 1;
  }

  if (movie.studio) {
    metrics.studioCounts[movie.studio] =
      (metrics.studioCounts[movie.studio] || 0) + 1;
  }

  const rating = movie.ratings?.imdb?.value ?? movie.ratings?.tmdb?.value;
  if (rating && rating > 0) {
    metrics.totalRating += rating;
    metrics.ratingCount++;
  }

  if (movie.runtime > 0) {
    metrics.totalRuntimeMinutes += movie.runtime;
  }

  if (movie.sizeOnDisk > 0) {
    metrics.totalSizeBytes += movie.sizeOnDisk;
  }

  if (movie.tmdbId) {
    metrics.tmdbIds.push({ tmdbId: movie.tmdbId, mediaType: "movie" });
  }
}

async function fetchRadarrLibrary(
  userId: string,
  metrics: LibraryMetrics
): Promise<number> {
  const radarrConfig = await getServiceConfig({
    userId,
    serviceName: "radarr",
  });

  if (!radarrConfig?.isEnabled) {
    return 0;
  }

  try {
    const client = new RadarrClient(radarrConfig);
    const movies = await client.get<RadarrMovie[]>("/movie");

    for (const movie of movies) {
      processMovie(movie, metrics);
    }

    const sortedMovies = [...movies].sort(
      (a, b) =>
        new Date(b.added ?? 0).getTime() - new Date(a.added ?? 0).getTime()
    );

    for (const movie of sortedMovies.slice(0, 10)) {
      metrics.recentlyAdded.push({
        title: movie.title,
        tmdbId: movie.tmdbId,
        genres: movie.genres ?? [],
        year: movie.year,
        mediaType: "movie",
      });
    }

    return movies.length;
  } catch {
    return 0;
  }
}

function processSeries(series: SonarrSeries, metrics: LibraryMetrics): void {
  for (const genre of series.genres ?? []) {
    metrics.genreCounts[genre] = (metrics.genreCounts[genre] || 0) + 1;
  }

  if (series.year) {
    const decade = getDecade(series.year);
    metrics.decadeCounts[decade] = (metrics.decadeCounts[decade] || 0) + 1;
    metrics.yearCounts[series.year] =
      (metrics.yearCounts[series.year] || 0) + 1;
  }

  if (series.network) {
    metrics.networkCounts[series.network] =
      (metrics.networkCounts[series.network] || 0) + 1;
  }

  const rating = series.ratings?.value;
  if (rating && rating > 0) {
    metrics.totalRating += rating;
    metrics.ratingCount++;
  }

  if (series.runtime > 0 && series.statistics?.episodeFileCount) {
    metrics.totalRuntimeMinutes +=
      series.runtime * series.statistics.episodeFileCount;
  }

  if (series.statistics?.sizeOnDisk && series.statistics.sizeOnDisk > 0) {
    metrics.totalSizeBytes += series.statistics.sizeOnDisk;
  }
}

async function fetchSonarrLibrary(
  userId: string,
  metrics: LibraryMetrics
): Promise<number> {
  const sonarrConfig = await getServiceConfig({
    userId,
    serviceName: "sonarr",
  });

  if (!sonarrConfig?.isEnabled) {
    return 0;
  }

  try {
    const client = new SonarrClient(sonarrConfig);
    const series = await client.get<SonarrSeries[]>("/series");

    for (const show of series) {
      processSeries(show, metrics);
    }

    const sortedSeries = [...series].sort(
      (a, b) =>
        new Date(b.added ?? 0).getTime() - new Date(a.added ?? 0).getTime()
    );

    for (const show of sortedSeries.slice(0, 10)) {
      metrics.recentlyAdded.push({
        title: show.title,
        tmdbId: show.tvdbId,
        genres: show.genres ?? [],
        year: show.year,
        mediaType: "tv",
      });
    }

    return series.length;
  } catch {
    return 0;
  }
}

function processMovieCredits(
  movieDetails: JellyseerrMovieDetails,
  directorCounts: Record<string, PersonCount>,
  actorCounts: Record<string, PersonCount>
): void {
  const directors = movieDetails.credits?.crew?.filter(
    (c) => c.job === "Director"
  );

  for (const director of directors ?? []) {
    const key = String(director.id);
    if (!directorCounts[key]) {
      directorCounts[key] = {
        id: director.id,
        name: director.name,
        count: 0,
        profilePath: director.profilePath,
      };
    }
    directorCounts[key].count++;
  }

  const topCast = movieDetails.credits?.cast?.slice(0, 5);

  for (const actor of topCast ?? []) {
    const key = String(actor.id);
    if (!actorCounts[key]) {
      actorCounts[key] = {
        id: actor.id,
        name: actor.name,
        count: 0,
        profilePath: actor.profilePath,
      };
    }
    actorCounts[key].count++;
  }
}

async function fetchMovieCreditsBatches(
  jellyseerrClient: JellyseerrClient,
  moviesToFetch: { tmdbId: number; mediaType: "movie" | "tv" }[]
): Promise<{
  directorCounts: Record<string, PersonCount>;
  actorCounts: Record<string, PersonCount>;
}> {
  const directorCounts: Record<string, PersonCount> = {};
  const actorCounts: Record<string, PersonCount> = {};

  const batchSize = 10;
  const maxMoviesToProcess = Math.min(moviesToFetch.length, 200);

  for (let i = 0; i < maxMoviesToProcess; i += batchSize) {
    const batch = moviesToFetch.slice(i, i + batchSize);
    const detailsPromises = batch.map(async ({ tmdbId }) => {
      try {
        return await jellyseerrClient.get<JellyseerrMovieDetails>(
          `/movie/${tmdbId}`
        );
      } catch {
        return null;
      }
    });

    // Use Promise.allSettled for better error tolerance - individual movie
    // detail fetches can fail without breaking the entire batch
    const settledDetails = await Promise.allSettled(detailsPromises);

    // Extract fulfilled results (nulls are already handled in the promise)
    const details = settledDetails
      .filter(
        (
          result
        ): result is PromiseFulfilledResult<JellyseerrMovieDetails | null> =>
          result.status === "fulfilled"
      )
      .map((result) => result.value);

    for (const movieDetails of details) {
      if (!movieDetails) {
        continue;
      }
      processMovieCredits(movieDetails, directorCounts, actorCounts);
    }
  }

  return { directorCounts, actorCounts };
}

function calculateGenreDiversity(genreCounts: Record<string, number>): number {
  const totalGenreCount = Object.values(genreCounts).reduce((a, b) => a + b, 0);

  if (totalGenreCount === 0) {
    return 0;
  }

  let diversityScore = 0;
  for (const count of Object.values(genreCounts)) {
    const p = count / totalGenreCount;
    diversityScore -= p * Math.log2(p);
  }

  return Math.min(100, (diversityScore / 3.5) * 100);
}

function buildGenreResults(genreCounts: Record<string, number>): GenreCount[] {
  const totalGenreCount = Object.values(genreCounts).reduce((a, b) => a + b, 0);

  return Object.entries(genreCounts)
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: totalGenreCount > 0 ? (count / totalGenreCount) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function buildDecadeResults(
  decadeCounts: Record<string, number>
): DecadeCount[] {
  const totalDecadeCount = Object.values(decadeCounts).reduce(
    (a, b) => a + b,
    0
  );

  return Object.entries(decadeCounts)
    .map(([decade, count]) => ({
      decade,
      count,
      percentage: totalDecadeCount > 0 ? (count / totalDecadeCount) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function buildDirectorResults(
  directorCounts: Record<string, PersonCount>
): PersonCount[] {
  return Object.values(directorCounts)
    .filter((d) => d.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function buildActorResults(
  actorCounts: Record<string, PersonCount>
): PersonCount[] {
  return Object.values(actorCounts)
    .filter((a) => a.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function buildStudioResults(
  studioCounts: Record<string, number>
): StudioCount[] {
  return Object.entries(studioCounts)
    .map(([studio, count]) => ({ studio, count }))
    .filter((s) => s.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function buildNetworkResults(
  networkCounts: Record<string, number>
): NetworkCount[] {
  return Object.entries(networkCounts)
    .map(([network, count]) => ({ network, count }))
    .filter((n) => n.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function buildYearResults(
  yearCounts: Record<number, number>
): { year: number; count: number }[] {
  return Object.entries(yearCounts)
    .map(([year, count]) => ({ year: Number(year), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// =============================================================================
// Deep Library Analysis
// =============================================================================

async function analyzeLibraryDeeply(
  userId: string,
  jellyseerrClient: JellyseerrClient
): Promise<DeepTasteProfile | null> {
  const metrics = initializeMetrics();

  const [totalMovies, totalShows] = await Promise.all([
    fetchRadarrLibrary(userId, metrics),
    fetchSonarrLibrary(userId, metrics),
  ]);

  const totalItems = totalMovies + totalShows;
  if (totalItems === 0) {
    return null;
  }

  const moviesToFetch = metrics.tmdbIds.filter((m) => m.mediaType === "movie");
  const { directorCounts, actorCounts } = await fetchMovieCreditsBatches(
    jellyseerrClient,
    moviesToFetch
  );

  const genreDiversityScore = calculateGenreDiversity(metrics.genreCounts);

  return {
    topGenres: buildGenreResults(metrics.genreCounts),
    favoriteDirectors: buildDirectorResults(directorCounts),
    favoriteActors: buildActorResults(actorCounts),
    favoriteDecades: buildDecadeResults(metrics.decadeCounts),
    favoriteStudios: buildStudioResults(metrics.studioCounts),
    favoriteNetworks: buildNetworkResults(metrics.networkCounts),
    recentlyAdded: metrics.recentlyAdded,
    totalMovies,
    totalShows,
    averageRating:
      metrics.ratingCount > 0 ? metrics.totalRating / metrics.ratingCount : 0,
    totalRuntimeHours: metrics.totalRuntimeMinutes / 60,
    totalSizeGB: metrics.totalSizeBytes / 1024 ** 3,
    genreDiversityScore: Math.round(genreDiversityScore),
    prefersMovies: totalMovies > totalShows,
    prefersTv: totalShows > totalMovies,
    topYears: buildYearResults(metrics.yearCounts),
  };
}

// =============================================================================
// Personalized Section Generators
// =============================================================================

async function getDirectorSection(
  client: JellyseerrClient,
  director: PersonCount,
  existingTmdbIds: Set<number>
): Promise<PersonalizedSection | null> {
  try {
    const credits = await client.get<JellyseerrPersonCredits>(
      `/person/${director.id}`
    );

    const directedMovies = (credits.crew ?? [])
      .filter((c) => c.job === "Director" && c.mediaType === "movie")
      .filter((m) => !existingTmdbIds.has(m.id))
      .filter((m) => mapStatus(m.mediaInfo) !== "available")
      .sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0))
      .slice(0, 12);

    if (directedMovies.length < 3) {
      return null;
    }

    return {
      id: `director-${director.id}`,
      title: `Because you love ${director.name}`,
      subtitle: `You have ${director.count} of their films`,
      reason: `Based on your collection of ${director.count} films by this director`,
      type: "director",
      items: directedMovies.map((m) =>
        mapResultToItem(m, `Directed by ${director.name}`)
      ),
    };
  } catch {
    return null;
  }
}

async function getActorSection(
  client: JellyseerrClient,
  actor: PersonCount,
  existingTmdbIds: Set<number>
): Promise<PersonalizedSection | null> {
  try {
    const credits = await client.get<JellyseerrPersonCredits>(
      `/person/${actor.id}`
    );

    const starredIn = (credits.cast ?? [])
      .filter((m) => !existingTmdbIds.has(m.id))
      .filter((m) => mapStatus(m.mediaInfo) !== "available")
      .sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0))
      .slice(0, 12);

    if (starredIn.length < 3) {
      return null;
    }

    return {
      id: `actor-${actor.id}`,
      title: `More ${actor.name} for you`,
      subtitle: `Appears in ${actor.count} items in your library`,
      reason: `Based on your ${actor.count} titles featuring this actor`,
      type: "actor",
      items: starredIn.map((m) => mapResultToItem(m, `Starring ${actor.name}`)),
    };
  } catch {
    return null;
  }
}

async function getDecadeSection(
  client: JellyseerrClient,
  decade: DecadeCount,
  topGenres: GenreCount[],
  existingTmdbIds: Set<number>,
  mediaType: "movie" | "tv"
): Promise<PersonalizedSection | null> {
  try {
    const startYear = Number.parseInt(decade.decade.replace("s", ""), 10);
    const endYear = startYear + 9;

    const topGenre = topGenres[0]?.genre?.toLowerCase();
    const genreId = topGenre ? GENRE_TO_ID[topGenre] : undefined;

    let endpoint = `/discover/${mediaType}?page=1`;
    endpoint += `&primaryReleaseDateGte=${startYear}-01-01`;
    endpoint += `&primaryReleaseDateLte=${endYear}-12-31`;
    if (genreId) {
      endpoint += `&genre=${genreId}`;
    }
    endpoint += "&sortBy=vote_average.desc";
    endpoint += "&voteCountGte=100";

    const response = await client.get<JellyseerrDiscoverResponse>(endpoint);

    const filtered = (response.results ?? [])
      .filter((m) => !existingTmdbIds.has(m.id))
      .filter((m) => mapStatus(m.mediaInfo) !== "available")
      .slice(0, 12);

    if (filtered.length < 3) {
      return null;
    }

    const decadeName = decade.decade;
    const genreName = topGenres[0]?.genre ?? "";

    return {
      id: `decade-${decadeName}`,
      title: `Your ${decadeName} obsession`,
      subtitle: `${decade.count} items from this era in your library`,
      reason: `You have ${decade.count} ${genreName.toLowerCase()} titles from the ${decadeName}`,
      type: "decade",
      items: filtered.map((m) =>
        mapResultToItem(m, `Classic ${decadeName} ${genreName.toLowerCase()}`)
      ),
    };
  } catch {
    return null;
  }
}

async function getHiddenGemsSection(
  client: JellyseerrClient,
  topGenres: GenreCount[],
  existingTmdbIds: Set<number>
): Promise<PersonalizedSection | null> {
  try {
    const genreName = topGenres[0]?.genre?.toLowerCase();
    const genreId = genreName ? GENRE_TO_ID[genreName] : undefined;

    let endpoint = "/discover/movie?page=1";
    endpoint += "&sortBy=vote_average.desc";
    endpoint += "&voteCountGte=50";
    endpoint += "&voteCountLte=1000";
    endpoint += "&voteAverageGte=7";
    if (genreId) {
      endpoint += `&genre=${genreId}`;
    }

    const response = await client.get<JellyseerrDiscoverResponse>(endpoint);

    const filtered = (response.results ?? [])
      .filter((m) => !existingTmdbIds.has(m.id))
      .filter((m) => mapStatus(m.mediaInfo) !== "available")
      .slice(0, 12);

    if (filtered.length < 3) {
      return null;
    }

    return {
      id: "hidden-gems",
      title: `Hidden gems in ${topGenres[0]?.genre ?? "your genres"}`,
      subtitle: "Highly rated but lesser known",
      reason: `Under-the-radar ${genreName ?? ""} films with great reviews`,
      type: "hidden-gems",
      items: filtered.map((m) =>
        mapResultToItem(m, "Hidden gem - highly rated but lesser known")
      ),
    };
  } catch {
    return null;
  }
}

async function getCriticallyAcclaimedSection(
  client: JellyseerrClient,
  topGenres: GenreCount[],
  existingTmdbIds: Set<number>
): Promise<PersonalizedSection | null> {
  try {
    const genreName = topGenres[0]?.genre?.toLowerCase();
    const genreId = genreName ? GENRE_TO_ID[genreName] : undefined;

    let endpoint = "/discover/movie?page=1";
    endpoint += "&sortBy=vote_average.desc";
    endpoint += "&voteCountGte=1000";
    endpoint += "&voteAverageGte=7.5";
    if (genreId) {
      endpoint += `&genre=${genreId}`;
    }

    const response = await client.get<JellyseerrDiscoverResponse>(endpoint);

    const filtered = (response.results ?? [])
      .filter((m) => !existingTmdbIds.has(m.id))
      .filter((m) => mapStatus(m.mediaInfo) !== "available")
      .slice(0, 12);

    if (filtered.length < 3) {
      return null;
    }

    return {
      id: "critically-acclaimed",
      title: `Critically acclaimed ${topGenres[0]?.genre ?? "films"}`,
      subtitle: "The best of best",
      reason: `Top-rated ${genreName ?? ""} movies you haven't seen`,
      type: "critically-acclaimed",
      items: filtered.map((m) =>
        mapResultToItem(m, `Rated ${m.voteAverage?.toFixed(1) ?? "highly"}`)
      ),
    };
  } catch {
    return null;
  }
}

async function getNewReleasesSection(
  client: JellyseerrClient,
  topGenres: GenreCount[],
  existingTmdbIds: Set<number>
): Promise<PersonalizedSection | null> {
  try {
    const genreName = topGenres[0]?.genre?.toLowerCase();
    const genreId = genreName ? GENRE_TO_ID[genreName] : undefined;

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const dateStr = oneYearAgo.toISOString().split("T")[0];

    let endpoint = "/discover/movie?page=1";
    endpoint += "&sortBy=popularity.desc";
    endpoint += `&primaryReleaseDateGte=${dateStr}`;
    if (genreId) {
      endpoint += `&genre=${genreId}`;
    }

    const response = await client.get<JellyseerrDiscoverResponse>(endpoint);

    const filtered = (response.results ?? [])
      .filter((m) => !existingTmdbIds.has(m.id))
      .filter((m) => mapStatus(m.mediaInfo) !== "available")
      .slice(0, 12);

    if (filtered.length < 3) {
      return null;
    }

    return {
      id: "new-releases",
      title: "New releases you'd love",
      subtitle: `Recent ${topGenres[0]?.genre?.toLowerCase() ?? ""} releases`,
      reason: `Fresh ${genreName ?? ""} content matching your taste`,
      type: "new-releases",
      items: filtered.map((m) =>
        mapResultToItem(m, "New release in your favorite genre")
      ),
    };
  } catch {
    return null;
  }
}

async function getSimilarToRecentSection(
  client: JellyseerrClient,
  recentItem: RecentItem,
  existingTmdbIds: Set<number>
): Promise<PersonalizedSection | null> {
  try {
    const endpoint = `/${recentItem.mediaType}/${recentItem.tmdbId}/similar`;
    const response = await client.get<JellyseerrDiscoverResponse>(endpoint);

    const filtered = (response.results ?? [])
      .filter((m) => !existingTmdbIds.has(m.id))
      .filter((m) => mapStatus(m.mediaInfo) !== "available")
      .slice(0, 12);

    if (filtered.length < 3) {
      return null;
    }

    return {
      id: `similar-${recentItem.tmdbId}`,
      title: `Because you watched ${recentItem.title}`,
      subtitle: `Similar ${recentItem.mediaType === "movie" ? "movies" : "shows"}`,
      reason: `Based on your recent addition of ${recentItem.title}`,
      type: "similar",
      items: filtered.map((m) =>
        mapResultToItem(m, `Similar to ${recentItem.title}`)
      ),
    };
  } catch {
    return null;
  }
}

async function getGenreDeepDiveSection(
  client: JellyseerrClient,
  genre: GenreCount,
  existingTmdbIds: Set<number>,
  mediaType: "movie" | "tv"
): Promise<PersonalizedSection | null> {
  try {
    const genreName = genre.genre.toLowerCase();
    const genreId = GENRE_TO_ID[genreName];

    if (!genreId) {
      return null;
    }

    let endpoint = `/discover/${mediaType}?page=1`;
    endpoint += "&sortBy=vote_average.desc";
    endpoint += "&voteCountGte=200";
    endpoint += `&genre=${genreId}`;

    const response = await client.get<JellyseerrDiscoverResponse>(endpoint);

    const filtered = (response.results ?? [])
      .filter((m) => !existingTmdbIds.has(m.id))
      .filter((m) => mapStatus(m.mediaInfo) !== "available")
      .slice(0, 12);

    if (filtered.length < 3) {
      return null;
    }

    return {
      id: `genre-${genreName}`,
      title: `Best in ${genre.genre}`,
      subtitle: `Your top genre with ${genre.count} titles`,
      reason: `Top-rated ${genreName} you haven't seen yet`,
      type: "genre",
      items: filtered.map((m) => mapResultToItem(m, `Top ${genre.genre} pick`)),
    };
  } catch {
    return null;
  }
}

async function getUnderratedPicksSection(
  client: JellyseerrClient,
  topGenres: GenreCount[],
  existingTmdbIds: Set<number>
): Promise<PersonalizedSection | null> {
  try {
    const genreIds = topGenres
      .slice(0, 3)
      .map((g) => GENRE_TO_ID[g.genre.toLowerCase()])
      .filter(Boolean);

    let endpoint = "/discover/movie?page=1";
    endpoint += "&sortBy=popularity.desc";
    endpoint += "&voteCountGte=100";
    endpoint += "&voteCountLte=2000";
    endpoint += "&voteAverageGte=6.5";
    endpoint += "&voteAverageLte=7.5";
    if (genreIds.length > 0) {
      endpoint += `&genre=${genreIds[0]}`;
    }

    const response = await client.get<JellyseerrDiscoverResponse>(endpoint);

    const filtered = (response.results ?? [])
      .filter((m) => !existingTmdbIds.has(m.id))
      .filter((m) => mapStatus(m.mediaInfo) !== "available")
      .slice(0, 12);

    if (filtered.length < 3) {
      return null;
    }

    return {
      id: "underrated-picks",
      title: "Underrated picks for you",
      subtitle: "Good films that flew under radar",
      reason: "Solid movies that deserve more attention",
      type: "hidden-gems",
      items: filtered.map((m) =>
        mapResultToItem(m, "Underrated gem worth checking out")
      ),
    };
  } catch {
    return null;
  }
}

// =============================================================================
// Main API Handler
// =============================================================================

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jellyseerrConfig = await getServiceConfig({
      userId: session.user.id,
      serviceName: "jellyseerr",
    });

    if (!jellyseerrConfig?.isEnabled) {
      return NextResponse.json({
        sections: [],
        profile: null,
        message: "Jellyseerr not configured",
      });
    }

    const client = new JellyseerrClient(jellyseerrConfig);

    const profile = await analyzeLibraryDeeply(session.user.id, client);

    if (!profile) {
      return NextResponse.json({
        sections: [],
        profile: null,
        message:
          "Add some content to your library to get personalized recommendations",
      });
    }

    const existingTmdbIds = new Set<number>(
      profile.recentlyAdded
        .filter((r) => r.mediaType === "movie")
        .map((r) => r.tmdbId)
    );

    const sectionPromises: Promise<PersonalizedSection | null>[] = [];

    for (const director of profile.favoriteDirectors.slice(0, 2)) {
      sectionPromises.push(
        getDirectorSection(client, director, existingTmdbIds)
      );
    }

    for (const actor of profile.favoriteActors.slice(0, 2)) {
      sectionPromises.push(getActorSection(client, actor, existingTmdbIds));
    }

    if (profile.favoriteDecades.length > 0) {
      sectionPromises.push(
        getDecadeSection(
          client,
          profile.favoriteDecades[0],
          profile.topGenres,
          existingTmdbIds,
          profile.prefersMovies ? "movie" : "tv"
        )
      );
    }

    sectionPromises.push(
      getHiddenGemsSection(client, profile.topGenres, existingTmdbIds)
    );

    sectionPromises.push(
      getCriticallyAcclaimedSection(client, profile.topGenres, existingTmdbIds)
    );

    sectionPromises.push(
      getNewReleasesSection(client, profile.topGenres, existingTmdbIds)
    );

    for (const recent of profile.recentlyAdded.slice(0, 2)) {
      if (recent.mediaType === "movie" && recent.tmdbId) {
        sectionPromises.push(
          getSimilarToRecentSection(client, recent, existingTmdbIds)
        );
      }
    }

    if (profile.topGenres.length > 1) {
      sectionPromises.push(
        getGenreDeepDiveSection(
          client,
          profile.topGenres[1],
          existingTmdbIds,
          "movie"
        )
      );
    }

    sectionPromises.push(
      getUnderratedPicksSection(client, profile.topGenres, existingTmdbIds)
    );

    // Use Promise.allSettled for better error tolerance - individual section
    // fetches can fail without breaking the entire recommendation engine
    const settledSections = await Promise.allSettled(sectionPromises);

    const sections = settledSections
      .filter(
        (
          result
        ): result is PromiseFulfilledResult<PersonalizedSection | null> =>
          result.status === "fulfilled"
      )
      .map((result) => result.value)
      .filter((s): s is PersonalizedSection => s !== null)
      .slice(0, 10);

    return NextResponse.json({
      sections,
      profile: {
        topGenres: profile.topGenres.slice(0, 5),
        favoriteDecades: profile.favoriteDecades.slice(0, 3),
        favoriteDirectors: profile.favoriteDirectors.slice(0, 5).map((d) => ({
          name: d.name,
          count: d.count,
        })),
        favoriteActors: profile.favoriteActors.slice(0, 5).map((a) => ({
          name: a.name,
          count: a.count,
        })),
        totalItems: profile.totalMovies + profile.totalShows,
        totalMovies: profile.totalMovies,
        totalShows: profile.totalShows,
        totalRuntimeHours: Math.round(profile.totalRuntimeHours),
        totalSizeGB: Math.round(profile.totalSizeGB * 10) / 10,
        averageRating: Math.round(profile.averageRating * 10) / 10,
        genreDiversityScore: profile.genreDiversityScore,
      },
      message:
        sections.length > 0
          ? `Generated ${sections.length} personalized sections based on your ${profile.totalMovies + profile.totalShows} items`
          : "No personalized recommendations available",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate personalized recommendations" },
      { status: 500 }
    );
  }
}
