import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { RadarrClientError, radarrRequest } from "./client";

type RefreshMovieProps = {
  session: Session;
};

export const refreshMovie = ({ session }: RefreshMovieProps) =>
  tool({
    description:
      "Refresh a movie's metadata and scan for files in Radarr. Use this after changing configurations or if a movie seems outdated.",
    inputSchema: z.object({
      movieId: z
        .number()
        .describe(
          "The Radarr movie ID to refresh (get this from getLibrary or searchMovies)"
        ),
    }),
    execute: async ({ movieId }) => {
      try {
        await radarrRequest(session.user.id, "/command", {
          method: "POST",
          body: JSON.stringify({
            name: "RefreshMovie",
            movieIds: [movieId],
          }),
        });

        return {
          success: true,
          message: `Refresh triggered for movie ID ${movieId}. Metadata will be updated.`,
        };
      } catch (error) {
        if (error instanceof RadarrClientError) {
          if (error.statusCode === 404) {
            return { error: `Movie with ID ${movieId} not found in Radarr.` };
          }
          if (error.statusCode === 401 || error.statusCode === 403) {
            return { error: `Radarr authentication failed: ${error.message}. Please check your API key.` };
          }
          return { error: `Radarr error: ${error.message}` };
        }
        return {
          error: `Failed to refresh movie: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        };
      }
    },
  });
