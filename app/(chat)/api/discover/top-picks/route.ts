import { generateText } from "ai";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getLanguageModel } from "@/lib/ai/providers";
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

interface TasteProfile {
  topGenres: { genre: string; count: number }[];
  topDirectors: { id: number; name: string; count: number }[];
  topActors: { id: number; name: string; count: number }[];
  topDecades: { decade: string; count: number }[];
  recentAdditions: string[];
  totalItems: number;
  averageRating: number;
  prefersMovies: boolean;
  prefersTv: boolean;
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
}

interface JellyseerrMovieDetails {
  id: number;
  title: string;
  releaseDate?: string;
  genres?: { id: number; name: string }[];
  credits?: {
    cast?: { id: number; name: string; order?: number }[];
    crew?: { id: number; name: string; job?: string }[];
  };
  backdropPath?: string;
  posterPath?: string;
  overview?: string;
  voteAverage?: number;
}

interface JellyseerrTvDetails {
  id: number;
  name: string;
  firstAirDate?: string;
  genres?: { id: number; name: string }[];
  credits?: {
    cast?: { id: number; name: string; order?: number }[];
  };
  backdropPath?: string;
  posterPath?: string;
  overview?: string;
  voteAverage?: number;
}

interface TopPickItem {
  id: number;
  title: string;
  year?: number;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating?: number;
  mediaType: "movie" | "tv";
  tmdbId: number;
  status: "available" | "requested" | "pending" | "unavailable";
  pitch: string;
  genres?: string[];
}

interface PitchGeneration {
  title: string;
  pitch: string;
}

// =============================================================================
// TMDB Genre Mapping
// =============================================================================

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

// =============================================================================
// Deep Library Analysis
// =============================================================================

async function analyzeTasteProfile(
  userId: string,
  jellyseerrClient: JellyseerrClient
): Promise<TasteProfile | null> {
  const [radarrConfig, sonarrConfig] = await Promise.all([
    getServiceConfig({ userId, serviceName: "radarr" }),
    getServiceConfig({ userId, serviceName: "sonarr" }),
  ]);

  const genreCounts: Record<string, number> = {};
  const decadeCounts: Record<string, number> = {};
  const directorCounts: Record<string, { id: number; name: string; count: number }> = {};
  const actorCounts: Record<string, { id: number; name: string; count: number }> = {};

  let totalRating = 0;
  let ratingCount = 0;
  let totalMovies = 0;
  let totalShows = 0;

  const recentAdditions: string[] = [];
  const tmdbIdsToFetch: { tmdbId: number; mediaType: "movie" | "tv" }[] = [];

  // Fetch Radarr library
  if (radarrConfig?.isEnabled) {
    try {
      const client = new RadarrClient(radarrConfig);
      const movies = await client.get<RadarrMovie[]>("/movie");
      totalMovies = movies.length;

      const sortedMovies = [...movies].sort(
        (a, b) =>
          new Date(b.added ?? 0).getTime() - new Date(a.added ?? 0).getTime()
      );

      for (const movie of movies) {
        for (const genre of movie.genres ?? []) {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }

        if (movie.year) {
          const decade = getDecade(movie.year);
          decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
        }

        const rating = movie.ratings?.imdb?.value ?? movie.ratings?.tmdb?.value;
        if (rating && rating > 0) {
          totalRating += rating;
          ratingCount++;
        }

        if (movie.tmdbId) {
          tmdbIdsToFetch.push({ tmdbId: movie.tmdbId, mediaType: "movie" });
        }
      }

      for (const movie of sortedMovies.slice(0, 5)) {
        recentAdditions.push(movie.title);
      }
    } catch (_e) {
      // Radarr not available
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
        for (const genre of show.genres ?? []) {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }

        if (show.year) {
          const decade = getDecade(show.year);
          decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
        }

        const rating = show.ratings?.value;
        if (rating && rating > 0) {
          totalRating += rating;
          ratingCount++;
        }
      }

      for (const show of sortedSeries.slice(0, 5)) {
        recentAdditions.push(show.title);
      }
    } catch (_e) {
      // Sonarr not available
    }
  }

  const totalItems = totalMovies + totalShows;
  if (totalItems === 0) {
    return null;
  }

  // Fetch detailed credits for sample of movies
  const moviesToFetch = tmdbIdsToFetch
    .filter((m) => m.mediaType === "movie")
    .slice(0, 50); // Sample 50 movies

  for (const { tmdbId } of moviesToFetch) {
    try {
      const details = await jellyseerrClient.get<JellyseerrMovieDetails>(
        `/movie/${tmdbId}`
      );

      // Count directors
      const directors = details.credits?.crew?.filter((c) => c.job === "Director");
      for (const director of directors ?? []) {
        const key = String(director.id);
        if (!directorCounts[key]) {
          directorCounts[key] = {
            id: director.id,
            name: director.name,
            count: 0,
          };
        }
        directorCounts[key].count++;
      }

      // Count top actors
      const topCast = details.credits?.cast?.slice(0, 3);
      for (const actor of topCast ?? []) {
        const key = String(actor.id);
        if (!actorCounts[key]) {
          actorCounts[key] = {
            id: actor.id,
            name: actor.name,
            count: 0,
          };
        }
        actorCounts[key].count++;
      }
    } catch (_e) {
      // Skip failed fetches
    }
  }

  // Sort and prepare results
  const topGenres = Object.entries(genreCounts)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topDecades = Object.entries(decadeCounts)
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const topDirectors = Object.values(directorCounts)
    .filter((d) => d.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topActors = Object.values(actorCounts)
    .filter((a) => a.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    topGenres,
    topDirectors,
    topActors,
    topDecades,
    recentAdditions,
    totalItems,
    averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
    prefersMovies: totalMovies > totalShows,
    prefersTv: totalShows > totalMovies,
  };
}

// =============================================================================
// Find Best Candidates
// =============================================================================

async function findTopCandidates(
  client: JellyseerrClient,
  profile: TasteProfile,
  existingTmdbIds: Set<number>
): Promise<JellyseerrDiscoverResult[]> {
  const candidates: JellyseerrDiscoverResult[] = [];

  // Use working Jellyseerr endpoints - same as main discover page
  const endpoints = [
    "/discover/trending",
    "/discover/movies",
    "/discover/movies/upcoming",
  ];

  // Add TV if user prefers TV
  if (profile.prefersTv) {
    endpoints.push("/discover/tv");
  }

  for (const endpoint of endpoints) {
    try {
      const response = await client.get<JellyseerrDiscoverResponse>(endpoint);
      for (const result of response.results ?? []) {
        // Only include unavailable content (not already in library)
        if (
          !existingTmdbIds.has(result.id) &&
          mapStatus(result.mediaInfo) === "unavailable" &&
          result.voteAverage &&
          result.voteAverage >= 6.5
        ) {
          candidates.push(result);
        }
      }
    } catch (_e) {
      console.error(`Failed to fetch ${endpoint}:`, _e);
    }
  }

  // Score candidates based on user's preferences
  const userTopGenreIds = new Set(
    profile.topGenres.slice(0, 3).map((g) => {
      // Map genre names to TMDB IDs (approximate)
      const genreMap: Record<string, number> = {
        action: 28, adventure: 12, animation: 16, comedy: 35,
        crime: 80, documentary: 99, drama: 18, family: 10751,
        fantasy: 14, history: 36, horror: 27, music: 10402,
        mystery: 9648, romance: 10749, "science fiction": 878,
        "sci-fi": 878, thriller: 53, war: 10752, western: 37,
      };
      return genreMap[g.genre.toLowerCase()] ?? 0;
    })
  );

  const scored = candidates.map((c) => {
    let score = c.voteAverage ?? 0;

    // Boost if matches user's favorite genres
    const matchingGenres = (c.genreIds ?? []).filter((id) => userTopGenreIds.has(id));
    score += matchingGenres.length * 1.5;

    // Prefer user's preferred media type
    if (profile.prefersMovies && c.mediaType === "movie") score += 1;
    if (profile.prefersTv && c.mediaType === "tv") score += 1;

    return { ...c, score };
  }).sort((a, b) => b.score - a.score);

  // Remove duplicates and return top picks
  const unique = Array.from(
    new Map(scored.map((item) => [item.id, item])).values()
  );

  return unique.slice(0, 10);
}

// =============================================================================
// Generate AI Pitches
// =============================================================================

async function generatePersonalizedPitches(
  profile: TasteProfile,
  candidates: Array<{
    id: number;
    title?: string;
    name?: string;
    overview?: string;
    mediaType: "movie" | "tv";
  }>
): Promise<PitchGeneration[]> {
  const profileSummary = `
User's Library Profile:
- Total items: ${profile.totalItems}
- Prefers: ${profile.prefersMovies ? "Movies" : "TV Shows"}
- Top genres: ${profile.topGenres.map((g) => g.genre).join(", ")}
- Favorite directors: ${profile.topDirectors.map((d) => d.name).join(", ") || "None yet"}
- Favorite actors: ${profile.topActors.map((a) => a.name).join(", ") || "None yet"}
- Recent additions: ${profile.recentAdditions.slice(0, 3).join(", ")}
- Average rating: ${profile.averageRating.toFixed(1)}/10
`.trim();

  const candidatesList = candidates
    .map(
      (c, idx) =>
        `${idx + 1}. "${c.title ?? c.name}" (${c.mediaType})\n   Overview: ${c.overview ?? "No overview available"}`
    )
    .join("\n\n");

  const prompt = `You are a film critic and recommendation expert. Based on the user's library profile, write a personalized 1-sentence pitch for each of the following titles that explains WHY they will love it based on their taste.

${profileSummary}

Titles to pitch:
${candidatesList}

Instructions:
- Write exactly ONE sentence per title (max 120 characters)
- Be specific and connect to their actual preferences (genres, directors, actors, recent additions)
- Sound enthusiastic but not over-the-top
- Focus on what makes it a great match for THEM specifically
- Use phrases like "Based on your love of...", "Perfect for fans of...", "Since you enjoyed..."

Format your response as a JSON array of objects with "title" and "pitch" fields. Example:
[
  {
    "title": "The Movie Title",
    "pitch": "Based on your love of sci-fi, this delivers mind-bending twists like Inception with stunning visuals."
  }
]

Return ONLY the JSON array, no other text.`;

  try {
    const result = await generateText({
      model: getLanguageModel("google/gemini-2.5-flash"),
      prompt,
    });

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonText = result.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```\n?$/g, "");
    }

    const pitches = JSON.parse(jsonText) as PitchGeneration[];
    return pitches;
  } catch (error) {
    console.error("Failed to generate pitches:", error);
    // Return generic pitches as fallback
    return candidates.map((c) => ({
      title: c.title ?? c.name ?? "Unknown",
      pitch:
        "A highly-rated title that matches your favorite genres and viewing preferences.",
    }));
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
        picks: [],
        message: "Jellyseerr not configured",
      });
    }

    const client = new JellyseerrClient(jellyseerrConfig);

    // Step 1: Analyze user's taste profile
    const profile = await analyzeTasteProfile(session.user.id, client);

    if (!profile || profile.totalItems < 5) {
      return NextResponse.json({
        picks: [],
        message: "Need more content in library for personalized picks",
      });
    }

    // Step 2: Find best candidates from trending/popular
    const existingTmdbIds = new Set<number>(); // We'll populate this from library if needed
    const candidates = await findTopCandidates(
      client,
      profile,
      existingTmdbIds
    );

    if (candidates.length === 0) {
      return NextResponse.json({
        picks: [],
        message: "No suitable candidates found",
      });
    }

    // Step 3: Fetch full details for top 3 candidates
    const topCandidates = candidates.slice(0, 3);
    const detailedCandidates = await Promise.all(
      topCandidates.map(async (candidate) => {
        try {
          if (candidate.mediaType === "movie") {
            const details = await client.get<JellyseerrMovieDetails>(
              `/movie/${candidate.id}`
            );
            return {
              ...candidate,
              overview: details.overview,
              backdropPath: details.backdropPath,
              genres: details.genres?.map((g) => g.name),
            };
          } else {
            const details = await client.get<JellyseerrTvDetails>(
              `/tv/${candidate.id}`
            );
            return {
              ...candidate,
              overview: details.overview,
              backdropPath: details.backdropPath,
              genres: details.genres?.map((g) => g.name),
            };
          }
        } catch {
          return candidate;
        }
      })
    );

    // Step 4: Generate personalized pitches using AI
    const pitches = await generatePersonalizedPitches(
      profile,
      detailedCandidates
    );

    // Step 5: Build response
    const picks: TopPickItem[] = detailedCandidates.map((candidate, idx) => {
      const pitch = pitches.find(
        (p) =>
          p.title === (candidate.title ?? candidate.name) ||
          (candidate.title ?? candidate.name ?? "").includes(p.title) ||
          p.title.includes(candidate.title ?? candidate.name ?? "")
      );

      return {
        id: candidate.id,
        title: candidate.title ?? candidate.name ?? "Unknown",
        year: parseYear(candidate.releaseDate ?? candidate.firstAirDate),
        posterUrl: candidate.posterPath
          ? `https://image.tmdb.org/t/p/w342${candidate.posterPath}`
          : null,
        backdropUrl:
          (candidate as any).backdropPath
            ? `https://image.tmdb.org/t/p/w1280${(candidate as any).backdropPath}`
            : null,
        rating: candidate.voteAverage,
        mediaType: candidate.mediaType,
        tmdbId: candidate.id,
        status: mapStatus(candidate.mediaInfo),
        pitch:
          pitch?.pitch ||
          "A top pick based on your viewing history and preferences.",
        genres: (candidate as any).genres,
      };
    });

    return NextResponse.json({
      picks,
      message: `Generated ${picks.length} deeply personalized picks`,
    });
  } catch (error) {
    console.error("Top picks error:", error);
    return NextResponse.json(
      { error: "Failed to generate top picks" },
      { status: 500 }
    );
  }
}
