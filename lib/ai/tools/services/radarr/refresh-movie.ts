import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { radarrRequest } from "./client";

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
    execute: withToolErrorHandling(
      { serviceName: "Radarr", operationName: "refresh movie" },
      async ({ movieId }) => {
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
      }
    ),
  });
