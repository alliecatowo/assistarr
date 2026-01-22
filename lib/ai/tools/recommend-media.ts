import { tool } from "ai";
import { z } from "zod";

/**
 * Schema for a single media recommendation
 */
const recommendationSchema = z.object({
  title: z.string().describe("The title of the movie or TV show"),
  year: z.number().optional().describe("Release year"),
  tmdbId: z.number().describe("The TMDB ID for this media"),
  mediaType: z
    .enum(["movie", "tv"])
    .describe("Whether this is a movie or TV show"),
  rating: z.number().optional().describe("Rating out of 10 (e.g., 8.5)"),
  reason: z.string().describe("Brief explanation of why this is recommended"),
  genres: z.array(z.string()).optional().describe("List of genres"),
  posterUrl: z.string().optional().describe("URL to the poster image if known"),
});

export type MediaRecommendation = z.infer<typeof recommendationSchema>;

/**
 * Output shape for recommendations - used by the renderer
 */
export interface RecommendationsOutput {
  recommendations: MediaRecommendation[];
  introduction?: string;
}

/**
 * Tool for presenting media recommendations with structured data.
 *
 * Instead of the AI writing recommendations as prose (which requires regex cleanup),
 * this tool outputs structured data that the UI renders as rich cards.
 */
export const recommendMedia = () =>
  tool({
    description:
      "Present media recommendations to the user with rich formatting. Use this tool instead of writing recommendations as plain text. The UI will render beautiful cards with posters, ratings, and request buttons. IMPORTANT: Only use tmdbIds that you have from previous tool results (like searchContent, getDiscovery, etc.). Do not make up tmdbIds.",
    inputSchema: z.object({
      recommendations: z
        .array(recommendationSchema)
        .min(1)
        .max(10)
        .describe("List of recommended movies or TV shows"),
      introduction: z
        .string()
        .optional()
        .describe("Brief introduction to the recommendations (1-2 sentences)"),
    }),
    execute: async ({ recommendations, introduction }) => {
      // The tool simply returns the structured data for the UI to render
      return {
        recommendations,
        introduction,
      } satisfies RecommendationsOutput;
    },
  });
