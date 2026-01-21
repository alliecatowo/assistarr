import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";

export const editMovie = ({ session: _session, config }: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
    description:
      "Edit a movie in Radarr. IMPORTANT: You must search for the movie first to get the correct 'movieId' and current details. do not guess.",
    inputSchema: z.object({
      movieId: z.number().describe("The ID of the movie to edit"),
      monitored: z
        .boolean()
        .optional()
        .describe("Whether the movie is monitored"),
      qualityProfileId: z
        .number()
        .optional()
        .describe("The ID of the quality profile to use"),
      rootFolderPath: z
        .string()
        .optional()
        .describe("The root folder path for the movie"),
      tags: z.array(z.number()).optional().describe("Array of tag IDs"),
    }),
    execute: async ({
      movieId,
      monitored,
      qualityProfileId,
      rootFolderPath,
      tags,
    }) => {
      try {
        // First, get the existing movie to merge updates
        const existingMovie = await client.get<Record<string, unknown>>(
          `/movie/${movieId}`
        );

        const body = {
          ...existingMovie,
          monitored: monitored ?? existingMovie.monitored,
          qualityProfileId: qualityProfileId ?? existingMovie.qualityProfileId,
          rootFolderPath: rootFolderPath ?? existingMovie.path,
          tags: tags ?? existingMovie.tags,
        };

        const result = await client.put<Record<string, unknown>>(
          `/movie/${movieId}`,
          body
        );

        return {
          success: true,
          movie: result,
        };
      } catch (error) {
        return {
          error: `Failed to edit movie: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};
