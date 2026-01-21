import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { radarrRequest } from "./client";

type EditMovieProps = {
  session: Session;
};

export const editMovie = ({ session }: EditMovieProps) =>
  tool({
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
    execute: withToolErrorHandling(
      { serviceName: "Radarr", operationName: "edit movie" },
      async ({
        movieId,
        monitored,
        qualityProfileId,
        rootFolderPath,
        tags,
      }: {
        movieId: number;
        monitored?: boolean;
        qualityProfileId?: number;
        rootFolderPath?: string;
        tags?: number[];
      }) => {
        // First, get the existing movie to merge updates
        const existingMovie = await radarrRequest<Record<string, unknown>>(
          session.user.id,
          `/movie/${movieId}`
        );

        const body = {
          ...existingMovie,
          monitored: monitored ?? existingMovie.monitored,
          qualityProfileId: qualityProfileId ?? existingMovie.qualityProfileId,
          rootFolderPath: rootFolderPath ?? existingMovie.path,
          tags: tags ?? existingMovie.tags,
        };

        const result = await radarrRequest(
          session.user.id,
          `/movie/${movieId}`,
          {
            method: "PUT",
            body: JSON.stringify(body),
          }
        );

        return {
          success: true,
          movie: result,
        };
      }
    ),
  });
