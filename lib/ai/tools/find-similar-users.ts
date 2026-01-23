import { tool } from "ai";
import { z } from "zod";

const similarUserRecommendationSchema = z.object({
  title: z.string().describe("The title of the movie or TV show"),
  year: z.number().optional().describe("Release year"),
  tmdbId: z.number().describe("The TMDB ID for this media"),
  mediaType: z
    .enum(["movie", "tv"])
    .describe("Whether this is a movie or TV show"),
  rating: z.number().optional().describe("Rating out of 10"),
  reason: z
    .string()
    .describe("Explanation like 'Users who liked X also liked Y'"),
  genres: z.array(z.string()).optional().describe("List of genres"),
  posterUrl: z.string().optional().describe("URL to the poster image"),
  similarUsersCount: z
    .number()
    .optional()
    .describe("How many similar users enjoyed this"),
  matchPercentage: z
    .number()
    .optional()
    .describe("Match percentage with user's taste"),
});

export type SimilarUserRecommendation = z.infer<
  typeof similarUserRecommendationSchema
>;

export interface SimilarUsersOutput {
  recommendations: SimilarUserRecommendation[];
  basedOnMedia?: {
    title: string;
    tmdbId: number;
    mediaType: "movie" | "tv";
  };
  totalSimilarUsers: number;
  introduction?: string;
}

export const findSimilarUsers = () =>
  tool({
    description:
      "Find users with similar viewing habits and get personalized recommendations based on what they enjoyed. Use this when the user wants recommendations from people with similar taste. The UI will render beautiful recommendation cards explaining why each item is recommended.",
    inputSchema: z.object({
      basedOnMediaTmdbId: z
        .number()
        .optional()
        .describe(
          "TMDB ID of specific media to find similar users who liked it"
        ),
      basedOnMediaType: z
        .enum(["movie", "tv"])
        .optional()
        .describe("Type of the media specified by basedOnMediaTmdbId"),
      limit: z
        .number()
        .min(1)
        .max(20)
        .default(10)
        .describe("Maximum number of recommendations to return"),
      minSimilarity: z
        .number()
        .min(0)
        .max(1)
        .default(0.3)
        .describe("Minimum similarity threshold for matching users (0-1)"),
    }),
    execute: () => {
      return {
        recommendations: [],
        totalSimilarUsers: 0,
      } satisfies SimilarUsersOutput;
    },
  });

export const presentSimilarUsersRecommendations = () =>
  tool({
    description:
      "Present personalized recommendations from users with similar tastes. Use this tool to display recommendations with rich formatting showing why each item is recommended (e.g., 'Users who liked [X] also liked [Y]'). The UI will render beautiful cards with posters, ratings, and request buttons.",
    inputSchema: z.object({
      recommendations: z
        .array(similarUserRecommendationSchema)
        .min(1)
        .max(20)
        .describe("List of recommended movies or TV shows with explanations"),
      basedOnMedia: z
        .object({
          title: z.string(),
          tmdbId: z.number(),
          mediaType: z.enum(["movie", "tv"]),
        })
        .optional()
        .describe(
          "The media item that was used as the basis for finding similar users"
        ),
      totalSimilarUsers: z
        .number()
        .default(1)
        .describe(
          "Total number of similar users whose preferences were analyzed"
        ),
      introduction: z
        .string()
        .optional()
        .describe("Brief introduction to the recommendations (1-2 sentences)"),
    }),
    execute: (args) => {
      return {
        recommendations: args.recommendations,
        basedOnMedia: args.basedOnMedia,
        totalSimilarUsers: args.totalSimilarUsers,
        introduction: args.introduction,
      } satisfies SimilarUsersOutput;
    },
  });
