import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { RadarrClientError, radarrRequest } from "./client";

type DeleteMovieProps = {
  session: Session;
};

export const deleteMovie = ({ session }: DeleteMovieProps) =>
  tool({
    description:
      "Delete a movie from Radarr. IMPORTANT: You must search for the movie first to get the correct 'movieId'. Do not guess the ID.",
    inputSchema: z.object({
      movieId: z.number().describe("The ID of the movie to delete"),
      deleteFiles: z
        .boolean()
        .optional()
        .describe("Whether to delete the movie files"),
      addImportListExclusion: z
        .boolean()
        .optional()
        .describe("Whether to exclude the movie from import lists"),
    }),
    execute: async ({
      movieId,
      deleteFiles = false,
      addImportListExclusion = false,
    }: {
      movieId: number;
      deleteFiles?: boolean;
      addImportListExclusion?: boolean;
    }) => {
      try {
        const queryParams = new URLSearchParams();
        if (deleteFiles) {
          queryParams.append("deleteFiles", "true");
        }
        if (addImportListExclusion) {
          queryParams.append("addImportListExclusion", "true");
        }

        await radarrRequest(
          session.user.id,
          `/movie/${movieId}?${queryParams.toString()}`,
          {
            method: "DELETE",
          }
        );

        return {
          success: true,
          message: `Movie with ID ${movieId} deleted successfully`,
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
          error: `Failed to delete movie: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        };
      }
    },
  });
