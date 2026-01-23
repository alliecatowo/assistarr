import { tool } from "ai";
import { z } from "zod";
import { getServiceConfig } from "@/lib/db/queries/service-config";
import { JellyseerrClient } from "@/lib/plugins/jellyseerr/client";
import {
  getResultTitle,
  getResultYear,
  type SearchResponse,
  type SearchResult,
} from "@/lib/plugins/jellyseerr/types";
import { getPosterUrl } from "@/lib/utils";

/**
 * Schema for a single media recommendation input from the AI.
 * tmdbId is optional - we'll look it up from Jellyseerr by title.
 */
const recommendationInputSchema = z.object({
  title: z.string().describe("The title of the movie or TV show"),
  year: z
    .number()
    .optional()
    .describe("Release year (helps find correct match)"),
  tmdbId: z
    .number()
    .optional()
    .describe("TMDB ID if known - will be verified/looked up if not provided"),
  mediaType: z
    .enum(["movie", "tv"])
    .describe("Whether this is a movie or TV show"),
  rating: z.number().optional().describe("Rating out of 10 (e.g., 8.5)"),
  reason: z.string().describe("Brief explanation of why this is recommended"),
  genres: z.array(z.string()).optional().describe("List of genres"),
  posterUrl: z.string().optional().describe("URL to the poster image if known"),
});

type RecommendationInput = z.infer<typeof recommendationInputSchema>;

/**
 * Schema for output - after enrichment with real data
 */
export interface MediaRecommendation {
  title: string;
  year?: number;
  tmdbId: number;
  mediaType: "movie" | "tv";
  rating?: number;
  reason: string;
  genres?: string[];
  posterUrl?: string;
}

/**
 * Output shape for recommendations - used by the renderer
 */
export interface RecommendationsOutput {
  recommendations: MediaRecommendation[];
  introduction?: string;
}

/**
 * Search Jellyseerr for a title and return the best match
 */
async function searchJellyseerr(
  client: JellyseerrClient,
  title: string,
  mediaType: "movie" | "tv",
  year?: number
): Promise<{
  tmdbId: number;
  posterUrl: string | null;
  year?: number;
  rating?: number;
} | null> {
  try {
    const response = await client.get<SearchResponse>(
      `/search?query=${encodeURIComponent(title)}&page=1`
    );

    if (!response.results || response.results.length === 0) {
      return null;
    }

    // Filter by media type
    const matches = response.results.filter((r) => r.mediaType === mediaType);
    if (matches.length === 0) {
      return null;
    }

    // Try to match by year if provided
    let bestMatch: SearchResult = matches[0];
    if (year) {
      const yearMatch = matches.find((r) => {
        const resultYear = getResultYear(r);
        return resultYear === year;
      });
      if (yearMatch) {
        bestMatch = yearMatch;
      }
    }

    // Also try exact title match
    const titleLower = title.toLowerCase();
    const exactMatch = matches.find((r) => {
      const resultTitle = getResultTitle(r).toLowerCase();
      return resultTitle === titleLower;
    });
    if (exactMatch) {
      bestMatch = exactMatch;
    }

    return {
      tmdbId: bestMatch.id,
      posterUrl: getPosterUrl(bestMatch.posterPath),
      year: getResultYear(bestMatch),
      rating: bestMatch.voteAverage,
    };
  } catch {
    return null;
  }
}

/**
 * Enrich a recommendation with real data from Jellyseerr
 */
async function enrichRecommendation(
  client: JellyseerrClient | null,
  rec: RecommendationInput
): Promise<MediaRecommendation | null> {
  // If we have a Jellyseerr client, search for real data
  if (client) {
    const searchResult = await searchJellyseerr(
      client,
      rec.title,
      rec.mediaType,
      rec.year
    );

    if (searchResult) {
      return {
        title: rec.title,
        year: searchResult.year ?? rec.year,
        tmdbId: searchResult.tmdbId,
        mediaType: rec.mediaType,
        rating: searchResult.rating ?? rec.rating,
        reason: rec.reason,
        genres: rec.genres,
        posterUrl: searchResult.posterUrl ?? rec.posterUrl,
      };
    }
  }

  // Fallback: use the AI's data if we have a tmdbId
  if (rec.tmdbId) {
    return {
      title: rec.title,
      year: rec.year,
      tmdbId: rec.tmdbId,
      mediaType: rec.mediaType,
      rating: rec.rating,
      reason: rec.reason,
      genres: rec.genres,
      posterUrl: rec.posterUrl,
    };
  }

  // Can't use this recommendation - no tmdbId and couldn't find it
  return null;
}

/**
 * Tool for presenting media recommendations with structured data.
 *
 * Instead of the AI writing recommendations as prose (which requires regex cleanup),
 * this tool outputs structured data that the UI renders as rich cards.
 *
 * IMPORTANT: This tool searches Jellyseerr for each recommendation to get
 * real tmdbIds and poster URLs, so the AI doesn't need to know them in advance.
 */
export const recommendMedia = (userId?: string) =>
  tool({
    description:
      "Present media recommendations to the user with rich formatting. Use this tool instead of writing recommendations as plain text. The UI will render beautiful cards with posters, ratings, and request buttons. Just provide the title, year, and mediaType - the system will look up the correct TMDB ID and poster automatically.",
    inputSchema: z.object({
      recommendations: z
        .array(recommendationInputSchema)
        .min(1)
        .max(10)
        .describe("List of recommended movies or TV shows"),
      introduction: z
        .string()
        .optional()
        .describe("Brief introduction to the recommendations (1-2 sentences)"),
    }),
    execute: async ({ recommendations, introduction }) => {
      // Get Jellyseerr client if available
      let client: JellyseerrClient | null = null;
      if (userId) {
        try {
          const config = await getServiceConfig({
            userId,
            serviceName: "jellyseerr",
          });
          if (config?.isEnabled) {
            client = new JellyseerrClient(config);
          }
        } catch {
          // Jellyseerr not configured - will use AI's data
        }
      }

      // Enrich all recommendations with real data
      const enrichedPromises = recommendations.map((rec) =>
        enrichRecommendation(client, rec)
      );
      const enrichedResults = await Promise.all(enrichedPromises);

      // Filter out nulls (recommendations we couldn't find)
      const validRecommendations = enrichedResults.filter(
        (r): r is MediaRecommendation => r !== null
      );

      return {
        recommendations: validRecommendations,
        introduction,
      } satisfies RecommendationsOutput;
    },
  });
