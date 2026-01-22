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
  // Genres
  topGenres: GenreCount[];

  // People
  favoriteDirectors: PersonCount[];
  favoriteActors: PersonCount[];

  // Time periods
  favoriteDecades: DecadeCount[];

  // Production
  favoriteStudios: StudioCount[];
  favoriteNetworks: NetworkCount[];

  // Recently added
  recentlyAdded: RecentItem[];

  // Stats
  totalMovies: number;
  totalShows: number;
  averageRating: number;
  totalRuntimeHours: number;
  totalSizeGB: number;
  genreDiversityScore: number;

  // Content preferences
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

interface JellyseerrTvDetails {
  id: number;
  name: string;
  firstAirDate?: string;
  genres?: { id: number; name: string }[];
  credits?: {
    cast?: { id: number; name: string; profilePath?: string; order?: number }[];
    crew?: { id: number; name: string; job?: string; profilePath?: string }[];
  };
  networks?: { id: number; name: string }[];
  createdBy?: { id: number; name: string; profilePath?: string }[];
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

// Genre name to TMDB ID mapping
const GENRE_TO_ID: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  "science fiction": 878,
  "sci-fi": 878,
  thriller: 53,
  war: 10752,
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
  if (!dateStr) return undefined;
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

// =============================================================================
// Deep Library Analysis
// =============================================================================

async function analyzeLibraryDeeply(
  userId: string,
  jellyseerrClient: JellyseerrClient
): Promise<DeepTasteProfile | null> {
  const [radarrConfig, sonarrConfig] = await Promise.all([
    getServiceConfig({ userId, serviceName: "radarr" }),
    getServiceConfig({ userId, serviceName: "sonarr" }),
  ]);

  const genreCounts: Record<string, number> = {};
  const decadeCounts: Record<string, number> = {};
  const yearCounts: Record<number, number> = {};
  const directorCounts: Record<string, PersonCount> = {};
  const actorCounts: Record<string, PersonCount> = {};
  const studioCounts: Record<string, number> = {};
  const networkCounts: Record<string, number> = {};

  let totalRating = 0;
  let ratingCount = 0;
  let totalMovies = 0;
  let totalShows = 0;
  let totalRuntimeMinutes = 0;
  let totalSizeBytes = 0;

  const recentlyAdded: RecentItem[] = [];
  const tmdbIdsToFetch: { tmdbId: number; mediaType: "movie" | "tv" }[] = [];

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

        // Count decades and years
        if (movie.year) {
          const decade = getDecade(movie.year);
          decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
          yearCounts[movie.year] = (yearCounts[movie.year] || 0) + 1;
        }

        // Count studios
        if (movie.studio) {
          studioCounts[movie.studio] = (studioCounts[movie.studio] || 0) + 1;
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

        // Collect TMDb IDs for detailed fetch
        if (movie.tmdbId) {
          tmdbIdsToFetch.push({ tmdbId: movie.tmdbId, mediaType: "movie" });
        }
      }

      // Add recent movies
      for (const movie of sortedMovies.slice(0, 10)) {
        recentlyAdded.push({
          title: movie.title,
          tmdbId: movie.tmdbId,
          genres: movie.genres ?? [],
          year: movie.year,
          mediaType: "movie",
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

        // Count decades and years
        if (show.year) {
          const decade = getDecade(show.year);
          decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
          yearCounts[show.year] = (yearCounts[show.year] || 0) + 1;
        }

        // Count networks
        if (show.network) {
          networkCounts[show.network] = (networkCounts[show.network] || 0) + 1;
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

        // Collect TVDb IDs (need to convert to TMDb for Jellyseerr)
        // For now, we'll use similar approach
      }

      // Add recent series
      for (const show of sortedSeries.slice(0, 10)) {
        recentlyAdded.push({
          title: show.title,
          tmdbId: show.tvdbId, // Note: this is TVDB, not TMDB
          genres: show.genres ?? [],
          year: show.year,
          mediaType: "tv",
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

  // Fetch detailed credits for movies to get director/actor data
  // Process ALL movies but in batches to avoid overwhelming the API
  // This ensures we capture all directors/actors, not just from recent additions
  const moviesToFetch = tmdbIdsToFetch.filter((m) => m.mediaType === "movie");

  // Fetch movie details in batches to get credits
  // Use smaller batch size and process all movies to get accurate director/actor counts
  const batchSize = 10;
  const maxMoviesToProcess = Math.min(moviesToFetch.length, 200); // Cap at 200 to avoid excessive API calls

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

    const details = await Promise.all(detailsPromises);

    for (const movieDetails of details) {
      if (!movieDetails) continue;

      // Count directors
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

      // Count lead actors (top 5 billed)
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

  // Sort and prepare results
  const topGenres = Object.entries(genreCounts)
    .map(([genre, count]) => ({
      genre,
      count,
      percentage: totalGenreCount > 0 ? (count / totalGenreCount) * 100 : 0,
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
      percentage: totalDecadeCount > 0 ? (count / totalDecadeCount) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const favoriteDirectors = Object.values(directorCounts)
    .filter((d) => d.count >= 2) // Only directors with 2+ movies
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const favoriteActors = Object.values(actorCounts)
    .filter((a) => a.count >= 2) // Only actors with 2+ appearances
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const favoriteStudios = Object.entries(studioCounts)
    .map(([studio, count]) => ({ studio, count }))
    .filter((s) => s.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const favoriteNetworks = Object.entries(networkCounts)
    .map(([network, count]) => ({ network, count }))
    .filter((n) => n.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topYears = Object.entries(yearCounts)
    .map(([year, count]) => ({ year: Number(year), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    topGenres,
    favoriteDirectors,
    favoriteActors,
    favoriteDecades,
    favoriteStudios,
    favoriteNetworks,
    recentlyAdded,
    totalMovies,
    totalShows,
    averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
    totalRuntimeHours: totalRuntimeMinutes / 60,
    totalSizeGB: totalSizeBytes / (1024 ** 3),
    genreDiversityScore: Math.round(genreDiversityScore),
    prefersMovies: totalMovies > totalShows,
    prefersTv: totalShows > totalMovies,
    topYears,
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

    // Get movies they directed (from crew)
    const directedMovies = (credits.crew ?? [])
      .filter((c) => c.job === "Director" && c.mediaType === "movie")
      .filter((m) => !existingTmdbIds.has(m.id))
      .filter((m) => mapStatus(m.mediaInfo) !== "available")
      .sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0))
      .slice(0, 12);

    if (directedMovies.length < 3) return null;

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

    // Get movies/shows they starred in
    const starredIn = (credits.cast ?? [])
      .filter((m) => !existingTmdbIds.has(m.id))
      .filter((m) => mapStatus(m.mediaInfo) !== "available")
      .sort((a, b) => (b.voteAverage ?? 0) - (a.voteAverage ?? 0))
      .slice(0, 12);

    if (starredIn.length < 3) return null;

    return {
      id: `actor-${actor.id}`,
      title: `More ${actor.name} for you`,
      subtitle: `Appears in ${actor.count} items in your library`,
      reason: `Based on your ${actor.count} titles featuring this actor`,
      type: "actor",
      items: starredIn.map((m) =>
        mapResultToItem(m, `Starring ${actor.name}`)
      ),
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
    // Parse decade to get year range
    const startYear = Number.parseInt(decade.decade.replace("s", ""), 10);
    const endYear = startYear + 9;

    // Get the top genre for this query
    const topGenre = topGenres[0]?.genre?.toLowerCase();
    const genreId = topGenre ? GENRE_TO_ID[topGenre] : undefined;

    let endpoint = `/discover/${mediaType}?page=1`;
    endpoint += `&primaryReleaseDateGte=${startYear}-01-01`;
    endpoint += `&primaryReleaseDateLte=${endYear}-12-31`;
    if (genreId) {
      endpoint += `&genre=${genreId}`;
    }
    endpoint += `&sortBy=vote_average.desc`;
    endpoint += `&voteCountGte=100`; // Ensure some popularity

    const response = await client.get<JellyseerrDiscoverResponse>(endpoint);

    const filtered = (response.results ?? [])
      .filter((m) => !existingTmdbIds.has(m.id))
      .filter((m) => mapStatus(m.mediaInfo) !== "available")
      .slice(0, 12);

    if (filtered.length < 3) return null;

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

    // Hidden gems: good rating (7-8) but lower popularity
    let endpoint = `/discover/movie?page=1`;
    endpoint += `&sortBy=vote_average.desc`;
    endpoint += `&voteCountGte=50`;
    endpoint += `&voteCountLte=1000`; // Less popular
    endpoint += `&voteAverageGte=7`;
    if (genreId) {
      endpoint += `&genre=${genreId}`;
    }

    const response = await client.get<JellyseerrDiscoverResponse>(endpoint);

    const filtered = (response.results ?? [])
      .filter((m) => !existingTmdbIds.has(m.id))
      .filter((m) => mapStatus(m.mediaInfo) !== "available")
      .slice(0, 12);

    if (filtered.length < 3) return null;

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

    // Critically acclaimed: high rating + high vote count
    let endpoint = `/discover/movie?page=1`;
    endpoint += `&sortBy=vote_average.desc`;
    endpoint += `&voteCountGte=1000`;
    endpoint += `&voteAverageGte=7.5`;
    if (genreId) {
      endpoint += `&genre=${genreId}`;
    }

    const response = await client.get<JellyseerrDiscoverResponse>(endpoint);

    const filtered = (response.results ?? [])
      .filter((m) => !existingTmdbIds.has(m.id))
      .filter((m) => mapStatus(m.mediaInfo) !== "available")
      .slice(0, 12);

    if (filtered.length < 3) return null;

    return {
      id: "critically-acclaimed",
      title: `Critically acclaimed ${topGenres[0]?.genre ?? "films"}`,
      subtitle: "The best of the best",
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

    // New releases in past year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const dateStr = oneYearAgo.toISOString().split("T")[0];

    let endpoint = `/discover/movie?page=1`;
    endpoint += `&sortBy=popularity.desc`;
    endpoint += `&primaryReleaseDateGte=${dateStr}`;
    if (genreId) {
      endpoint += `&genre=${genreId}`;
    }

    const response = await client.get<JellyseerrDiscoverResponse>(endpoint);

    const filtered = (response.results ?? [])
      .filter((m) => !existingTmdbIds.has(m.id))
      .filter((m) => mapStatus(m.mediaInfo) !== "available")
      .slice(0, 12);

    if (filtered.length < 3) return null;

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

    if (filtered.length < 3) return null;

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

    if (!genreId) return null;

    let endpoint = `/discover/${mediaType}?page=1`;
    endpoint += `&sortBy=vote_average.desc`;
    endpoint += `&voteCountGte=200`;
    endpoint += `&genre=${genreId}`;

    const response = await client.get<JellyseerrDiscoverResponse>(endpoint);

    const filtered = (response.results ?? [])
      .filter((m) => !existingTmdbIds.has(m.id))
      .filter((m) => mapStatus(m.mediaInfo) !== "available")
      .slice(0, 12);

    if (filtered.length < 3) return null;

    return {
      id: `genre-${genreName}`,
      title: `Best in ${genre.genre}`,
      subtitle: `Your top genre with ${genre.count} titles`,
      reason: `Top-rated ${genreName} you haven't seen yet`,
      type: "genre",
      items: filtered.map((m) =>
        mapResultToItem(m, `Top ${genre.genre} pick`)
      ),
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
    // Mix genres for variety
    const genreIds = topGenres
      .slice(0, 3)
      .map((g) => GENRE_TO_ID[g.genre.toLowerCase()])
      .filter(Boolean);

    // Underrated: good rating (6.5-7.5) with moderate popularity
    let endpoint = `/discover/movie?page=1`;
    endpoint += `&sortBy=popularity.desc`;
    endpoint += `&voteCountGte=100`;
    endpoint += `&voteCountLte=2000`;
    endpoint += `&voteAverageGte=6.5`;
    endpoint += `&voteAverageLte=7.5`;
    if (genreIds.length > 0) {
      endpoint += `&genre=${genreIds[0]}`;
    }

    const response = await client.get<JellyseerrDiscoverResponse>(endpoint);

    const filtered = (response.results ?? [])
      .filter((m) => !existingTmdbIds.has(m.id))
      .filter((m) => mapStatus(m.mediaInfo) !== "available")
      .slice(0, 12);

    if (filtered.length < 3) return null;

    return {
      id: "underrated-picks",
      title: "Underrated picks for you",
      subtitle: "Good films that flew under the radar",
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

    // Deep analysis of user's library
    const profile = await analyzeLibraryDeeply(session.user.id, client);

    if (!profile) {
      return NextResponse.json({
        sections: [],
        profile: null,
        message: "Add some content to your library to get personalized recommendations",
      });
    }

    // Build set of existing TMDb IDs to exclude
    const existingTmdbIds = new Set<number>(
      profile.recentlyAdded
        .filter((r) => r.mediaType === "movie")
        .map((r) => r.tmdbId)
    );

    // Generate personalized sections in parallel
    const sectionPromises: Promise<PersonalizedSection | null>[] = [];

    // 1. Director sections (up to 2)
    for (const director of profile.favoriteDirectors.slice(0, 2)) {
      sectionPromises.push(
        getDirectorSection(client, director, existingTmdbIds)
      );
    }

    // 2. Actor sections (up to 2)
    for (const actor of profile.favoriteActors.slice(0, 2)) {
      sectionPromises.push(getActorSection(client, actor, existingTmdbIds));
    }

    // 3. Decade section
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

    // 4. Hidden gems section
    sectionPromises.push(
      getHiddenGemsSection(client, profile.topGenres, existingTmdbIds)
    );

    // 5. Critically acclaimed section
    sectionPromises.push(
      getCriticallyAcclaimedSection(client, profile.topGenres, existingTmdbIds)
    );

    // 6. New releases section
    sectionPromises.push(
      getNewReleasesSection(client, profile.topGenres, existingTmdbIds)
    );

    // 7. Similar to recent (pick 1-2 recent items)
    for (const recent of profile.recentlyAdded.slice(0, 2)) {
      if (recent.mediaType === "movie" && recent.tmdbId) {
        sectionPromises.push(
          getSimilarToRecentSection(client, recent, existingTmdbIds)
        );
      }
    }

    // 8. Genre deep dive (secondary genre)
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

    // 9. Underrated picks
    sectionPromises.push(
      getUnderratedPicksSection(client, profile.topGenres, existingTmdbIds)
    );

    // Execute all section generators
    const sectionResults = await Promise.all(sectionPromises);

    // Filter out nulls and take the best sections
    const sections = sectionResults
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
  } catch (error) {
    console.error("Personalized recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to generate personalized recommendations" },
      { status: 500 }
    );
  }
}
