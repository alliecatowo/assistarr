import { tool } from "ai";
import { z } from "zod";
import { invalidateUserCache } from "@/lib/cache/library-cache";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";

export const deleteMovie = ({ session, config }: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
    description:
      "Delete a movie from Radarr. IMPORTANT: You must search for the movie first to get the correct 'movieId'. Do not guess the ID.",
    inputSchema: z.object({
      movieId: z.number().describe("The ID of the movie to delete"),
      deleteFiles: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to delete the movie files"),
      addImportListExclusion: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether to exclude the movie from import lists"),
    }),
    execute: async ({ movieId, deleteFiles, addImportListExclusion }) => {
      const queryParams = {
        deleteFiles,
        addImportListExclusion,
      };

      await client.delete(`/movie/${movieId}`, queryParams);

      // Invalidate library cache so personalized recommendations update
      if (session.user?.id) {
        invalidateUserCache(session.user.id);
      }

      return {
        success: true,
        message: `Movie with ID ${movieId} deleted successfully`,
      };
    },
  });
};
