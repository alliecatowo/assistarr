import { generateText } from "ai";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getLanguageModel } from "@/lib/ai/providers";
import { getServiceConfig } from "@/lib/db/queries/service-config";
import type { ServiceConfig } from "@/lib/db/schema";
import { JellyseerrClient } from "@/lib/plugins/jellyseerr/client";
import { RadarrClient } from "@/lib/plugins/radarr/client";
import type { RadarrMovie } from "@/lib/plugins/radarr/types";
import { SonarrClient } from "@/lib/plugins/sonarr/client";
import type { SonarrSeries } from "@/lib/plugins/sonarr/types";

// =============================================================================
// Type Definitions
// =============================================================================

interface TasteProfile {
  topGenres: { genre: string; count: number }[];
  favoriteDecades: { decade: string; count: number }[];
  favoriteDirectors: { name: string; count: number }[];
  favoriteActors: { name: string; count: number }[];
  recentTitles: string[];
  totalItems: number;
}

interface JellyseerrMediaDetails {
  id: number;
  title?: string;
  name?: string;
  releaseDate?: string;
  firstAirDate?: string;
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
      order?: number;
    }[];
    crew?: {
      id: number;
      name: string;
      job?: string;
      profilePath?: string;
    }[];
  };
  productionCompanies?: { id: number; name: string }[];
  networks?: { id: number; name: string }[];
  createdBy?: { id: number; name: string }[];
}

interface JellyseerrMovieDetails extends JellyseerrMediaDetails {
  tagline?: string;
  budget?: number;
  revenue?: number;
}

interface JellyseerrTvDetails extends JellyseerrMediaDetails {
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  status?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getDecade(year: number): string {
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

/**
 * Analyze user's library to build a taste profile
 */
async function buildTasteProfile(
  userId: string,
  jellyseerrClient: JellyseerrClient
): Promise<TasteProfile | null> {
  const [radarrConfig, sonarrConfig] = await Promise.all([
    getServiceConfig({ userId, serviceName: "radarr" }),
    getServiceConfig({ userId, serviceName: "sonarr" }),
  ]);

  const genreCounts: Record<string, number> = {};
  const decadeCounts: Record<string, number> = {};
  const directorCounts: Record<string, number> = {};
  const actorCounts: Record<string, number> = {};
  const recentTitles: string[] = [];

  let totalItems = 0;
  const movieTmdbIds: number[] = [];

  const radarResult = await processRadarrLibrary(
    radarrConfig,
    genreCounts,
    decadeCounts,
    recentTitles,
    movieTmdbIds
  );
  totalItems += radarResult.totalItems;

  const sonarrResult = await processSonarrLibrary(
    sonarrConfig,
    genreCounts,
    decadeCounts,
    recentTitles
  );
  totalItems += sonarrResult.totalItems;

  if (totalItems === 0) {
    return null;
  }

  await fetchMovieCredits(
    movieTmdbIds,
    jellyseerrClient,
    directorCounts,
    actorCounts
  );

  return buildTasteProfileResult(
    genreCounts,
    decadeCounts,
    directorCounts,
    actorCounts,
    recentTitles,
    totalItems
  );
}

async function processRadarrLibrary(
  radarrConfig: ServiceConfig | null,
  genreCounts: Record<string, number>,
  decadeCounts: Record<string, number>,
  recentTitles: string[],
  movieTmdbIds: number[]
): Promise<{ totalItems: number }> {
  let totalItems = 0;

  if (radarrConfig?.isEnabled) {
    try {
      const client = new RadarrClient(radarrConfig);
      const movies = await client.get<RadarrMovie[]>("/movie");

      const sortedMovies = [...movies].sort(
        (a, b) =>
          new Date(b.added ?? 0).getTime() - new Date(a.added ?? 0).getTime()
      );

      for (const movie of movies) {
        totalItems++;
        countMovieGenres(movie, genreCounts);
        countMovieDecade(movie, decadeCounts);

        if (movie.tmdbId) {
          movieTmdbIds.push(movie.tmdbId);
        }
      }

      addRecentMovies(sortedMovies, recentTitles);
    } catch {
      // Radarr not available - continue
    }
  }

  return { totalItems };
}

function countMovieGenres(
  movie: RadarrMovie,
  genreCounts: Record<string, number>
): void {
  for (const genre of movie.genres ?? []) {
    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
  }
}

function countMovieDecade(
  movie: RadarrMovie,
  decadeCounts: Record<string, number>
): void {
  if (movie.year) {
    const decade = getDecade(movie.year);
    decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
  }
}

function addRecentMovies(movies: RadarrMovie[], recentTitles: string[]): void {
  for (const movie of movies.slice(0, 10)) {
    recentTitles.push(movie.title);
  }
}

async function processSonarrLibrary(
  sonarrConfig: ServiceConfig | null,
  genreCounts: Record<string, number>,
  decadeCounts: Record<string, number>,
  recentTitles: string[]
): Promise<{ totalItems: number }> {
  let totalItems = 0;

  if (sonarrConfig?.isEnabled) {
    try {
      const client = new SonarrClient(sonarrConfig);
      const series = await client.get<SonarrSeries[]>("/series");

      const sortedSeries = [...series].sort(
        (a, b) =>
          new Date(b.added ?? 0).getTime() - new Date(a.added ?? 0).getTime()
      );

      for (const show of series) {
        totalItems++;
        countSeriesGenres(show, genreCounts);
        countSeriesDecade(show, decadeCounts);
      }

      addRecentSeries(sortedSeries, recentTitles);
    } catch {
      // Sonarr not available - continue
    }
  }

  return { totalItems };
}

function countSeriesGenres(
  series: SonarrSeries,
  genreCounts: Record<string, number>
): void {
  for (const genre of series.genres ?? []) {
    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
  }
}

function countSeriesDecade(
  series: SonarrSeries,
  decadeCounts: Record<string, number>
): void {
  if (series.year) {
    const decade = getDecade(series.year);
    decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
  }
}

function addRecentSeries(series: SonarrSeries[], recentTitles: string[]): void {
  for (const show of series.slice(0, 10)) {
    recentTitles.push(show.title);
  }
}

async function fetchMovieCredits(
  movieTmdbIds: number[],
  jellyseerrClient: JellyseerrClient,
  directorCounts: Record<string, number>,
  actorCounts: Record<string, number>
): Promise<void> {
  const moviesToFetch = movieTmdbIds.slice(0, 20);
  const batchSize = 5;

  for (let i = 0; i < moviesToFetch.length; i += batchSize) {
    const batch = moviesToFetch.slice(i, i + batchSize);
    const detailsPromises = batch.map(async (tmdbId) => {
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

      countMovieDirectors(movieDetails, directorCounts);
      countMovieActors(movieDetails, actorCounts);
    }
  }
}

function countMovieDirectors(
  movieDetails: JellyseerrMovieDetails,
  directorCounts: Record<string, number>
): void {
  const directors = movieDetails.credits?.crew?.filter(
    (c) => c.job === "Director"
  );
  for (const director of directors ?? []) {
    directorCounts[director.name] = (directorCounts[director.name] || 0) + 1;
  }
}

function countMovieActors(
  movieDetails: JellyseerrMovieDetails,
  actorCounts: Record<string, number>
): void {
  const topCast = movieDetails.credits?.cast?.slice(0, 3);
  for (const actor of topCast ?? []) {
    actorCounts[actor.name] = (actorCounts[actor.name] || 0) + 1;
  }
}

function buildTasteProfileResult(
  genreCounts: Record<string, number>,
  decadeCounts: Record<string, number>,
  directorCounts: Record<string, number>,
  actorCounts: Record<string, number>,
  recentTitles: string[],
  totalItems: number
): TasteProfile {
  const topGenres = Object.entries(genreCounts)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const favoriteDecades = Object.entries(decadeCounts)
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const favoriteDirectors = Object.entries(directorCounts)
    .filter(([, count]) => count >= 2)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const favoriteActors = Object.entries(actorCounts)
    .filter(([, count]) => count >= 2)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    topGenres,
    favoriteDecades,
    favoriteDirectors,
    favoriteActors,
    recentTitles: recentTitles.slice(0, 15),
    totalItems,
  };
}

/**
 * Build a prompt for generating a personalized pitch
 */
function buildPitchPrompt(
  profile: TasteProfile,
  mediaDetails: JellyseerrMovieDetails | JellyseerrTvDetails,
  mediaType: "movie" | "tv"
): string {
  // Format taste profile
  const genresList = profile.topGenres
    .slice(0, 5)
    .map((g) => `${g.genre} (${g.count} titles)`)
    .join(", ");

  const decadesList = profile.favoriteDecades
    .slice(0, 3)
    .map((d) => `${d.decade} (${d.count} titles)`)
    .join(", ");

  const directorsList =
    profile.favoriteDirectors.length > 0
      ? profile.favoriteDirectors
          .slice(0, 3)
          .map((d) => `${d.name} (${d.count} films)`)
          .join(", ")
      : "Not enough data yet";

  const actorsList =
    profile.favoriteActors.length > 0
      ? profile.favoriteActors
          .slice(0, 3)
          .map((a) => `${a.name} (${a.count} appearances)`)
          .join(", ")
      : "Not enough data yet";

  const recentTitlesList = profile.recentTitles.slice(0, 8).join(", ");

  // Format media details
  const title = mediaDetails.title ?? mediaDetails.name ?? "Unknown";
  const year =
    mediaDetails.releaseDate?.slice(0, 4) ??
    mediaDetails.firstAirDate?.slice(0, 4) ??
    "Unknown";
  const genres =
    mediaDetails.genres?.map((g) => g.name).join(", ") ?? "Unknown";
  const rating = mediaDetails.voteAverage?.toFixed(1) ?? "N/A";
  const overview = mediaDetails.overview ?? "No description available.";

  const director = mediaDetails.credits?.crew?.find(
    (c) => c.job === "Director"
  )?.name;
  const topCast = mediaDetails.credits?.cast
    ?.slice(0, 5)
    .map((c) => c.name)
    .join(", ");

  const tvDetails = mediaDetails as JellyseerrTvDetails;
  const creators = tvDetails.createdBy?.map((c) => c.name).join(", ");
  const networks = tvDetails.networks?.map((n) => n.name).join(", ");

  return `You are a friend who knows the user's taste in ${mediaType === "movie" ? "movies" : "TV shows"} intimately. Your job is to write a compelling, personalized pitch for why THIS SPECIFIC USER would love this ${mediaType}.

## User's Taste Profile

**Library Size:** ${profile.totalItems} titles
**Favorite Genres:** ${genresList}
**Preferred Decades:** ${decadesList}
**Favorite Directors:** ${directorsList}
**Favorite Actors:** ${actorsList}
**Recently Added to Library:** ${recentTitlesList}

## The ${mediaType === "movie" ? "Movie" : "Show"} to Pitch

**Title:** ${title} (${year})
**Genres:** ${genres}
**Rating:** ${rating}/10
${director ? `**Director:** ${director}` : creators ? `**Created By:** ${creators}` : ""}
${topCast ? `**Starring:** ${topCast}` : ""}
${networks ? `**Network:** ${networks}` : ""}

**Overview:** ${overview}

## Your Task

Write a 2-3 sentence personalized pitch explaining why THIS USER specifically would love this ${mediaType}.

Rules:
1. Reference their ACTUAL preferences from the taste profile (genres they love, directors/actors they follow, decades they prefer)
2. Make specific connections between their taste and this ${mediaType}'s qualities
3. Don't be generic - make it feel like a friend who knows them well is recommending it
4. Be enthusiastic but not over-the-top
5. If there's overlap with their favorites (same director, actor, genre, decade), highlight it!
6. Keep it conversational and compelling
7. Do NOT use phrases like "based on your taste" or "your profile shows" - just make the recommendation naturally

Example tone: "The sharp dialogue and ensemble cast give this the same energy you loved in [movie they have]. Plus, [director] brings that slow-burn tension you can't resist."

Now write the pitch:`;
}

// =============================================================================
// API Handler
// =============================================================================

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

  try {
    const client = new JellyseerrClient(jellyseerrConfig);

    // Fetch taste profile and media details in parallel
    const [tasteProfile, mediaDetails] = await Promise.all([
      buildTasteProfile(session.user.id, client),
      client.get<JellyseerrMovieDetails | JellyseerrTvDetails>(
        `/${mediaType}/${tmdbId}`
      ),
    ]);

    if (!tasteProfile) {
      // No library data - return a generic but still engaging pitch
      const title = mediaDetails.title ?? mediaDetails.name ?? "this";
      const genres = mediaDetails.genres?.map((g) => g.name).join(" and ");
      const rating = mediaDetails.voteAverage;

      let genericPitch = `${title} is a ${rating && rating >= 7.5 ? "critically acclaimed" : "compelling"} ${mediaType === "movie" ? "film" : "series"}`;
      if (genres) {
        genericPitch += ` that blends ${genres}`;
      }
      genericPitch +=
        ". Add some titles to your library to get personalized recommendations!";

      return NextResponse.json({
        pitch: genericPitch,
        hasProfile: false,
      });
    }

    // Build the prompt
    const prompt = buildPitchPrompt(tasteProfile, mediaDetails, mediaType);

    // Generate the pitch using AI
    const { text: pitch } = await generateText({
      model: getLanguageModel("google/gemini-2.5-flash"),
      prompt,
    });

    return NextResponse.json({
      pitch: pitch.trim(),
      hasProfile: true,
      profile: {
        topGenres: tasteProfile.topGenres.slice(0, 3),
        totalItems: tasteProfile.totalItems,
      },
    });
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to generate personalized pitch" },
      { status: 500 }
    );
  }
}
