import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";

export const refreshMovie = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
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
        await client.post("/api/v3/command", {
          name: "RefreshMovie",
          movieIds: [movieId],
        });

        return {
          success: true,
          message: `Refresh triggered for movie ID ${movieId}. Metadata will be updated.`,
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to refresh movie: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};
