import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { RadarrClientError, radarrRequest } from "./client";

type TriggerSearchProps = {
  session: Session;
};

export const triggerSearch = ({ session }: TriggerSearchProps) =>
  tool({
    description:
      "Trigger a new search for a movie in Radarr. Use this when a movie is stuck in the queue or you want to find a better release. IMPORTANT: You must search for the movie first to get the correct 'movieId'.",
    parameters: z.object({
      movieId: z
        .number()
        .describe(
          "The Radarr movie ID to search for (get this from getLibrary or searchMovies)"
        ),
    }),
    execute: async ({ movieId }) => {
      try {
        await radarrRequest(session.user.id, "/command", {
          method: "POST",
          body: JSON.stringify({
            name: "MoviesSearch",
            movieIds: [movieId],
          }),
        });

        return {
          success: true,
          message: `Search triggered for movie ID ${movieId}. Radarr will now look for available releases.`,
        };
      } catch (error) {
        if (error instanceof RadarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to trigger search. Please try again." };
      }
    },
  });
