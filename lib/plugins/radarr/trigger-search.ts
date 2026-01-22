import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";

export const triggerSearch = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
    description:
      "Trigger a new search for a movie in Radarr. Use this when a movie is stuck in the queue or you want to find a better release. IMPORTANT: You must search for the movie first to get the correct 'movieId'.",
    inputSchema: z.object({
      movieId: z
        .number()
        .describe(
          "The Radarr movie ID to search for (get this from getLibrary or searchMovies)"
        ),
    }),
    execute: async ({ movieId }) => {
      await client.post("/command", {
        name: "MoviesSearch",
        movieIds: [movieId],
      });

      return {
        success: true,
        message: `Search triggered for movie ID ${movieId}. Radarr will now look for available releases.`,
      };
    },
  });
};
