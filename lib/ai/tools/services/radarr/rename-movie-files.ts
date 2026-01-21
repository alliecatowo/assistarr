import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { RadarrClientError, radarrRequest } from "./client";
import type { RadarrCommand } from "./types";

type RenameMovieFilesProps = {
  session: Session;
};

export const renameMovieFiles = ({ session }: RenameMovieFilesProps) =>
  tool({
    description:
      "Rename movie files to match Radarr's naming convention. Use getMovieFiles first to get file IDs. You can rename all files for a movie or specify particular files.",
    inputSchema: z.object({
      movieId: z
        .number()
        .describe("The movie ID whose files should be renamed"),
      fileIds: z
        .array(z.number())
        .optional()
        .describe(
          "Optional array of specific file IDs to rename. If not provided, renames all files for the movie."
        ),
    }),
    execute: async ({ movieId, fileIds }) => {
      try {
        const commandBody: Record<string, unknown> = {
          name: "RenameFiles",
          movieId,
        };

        if (fileIds && fileIds.length > 0) {
          commandBody.files = fileIds;
        }

        const command = await radarrRequest<RadarrCommand>(
          session.user.id,
          "/command",
          {
            method: "POST",
            body: JSON.stringify(commandBody),
          }
        );

        return {
          success: true,
          commandId: command.id,
          status: command.status,
          message: fileIds
            ? `Rename started for ${fileIds.length} file(s). Command ID: ${command.id}`
            : `Rename started for all files of movie ${movieId}. Command ID: ${command.id}`,
        };
      } catch (error) {
        if (error instanceof RadarrClientError) {
          if (error.statusCode === 404) {
            return { error: `Movie with ID ${movieId} not found in Radarr.` };
          }
          if (error.statusCode === 400) {
            return { error: `Failed to rename: ${error.message}. Check that the movie has files to rename.` };
          }
          if (error.statusCode === 401 || error.statusCode === 403) {
            return { error: `Radarr authentication failed: ${error.message}. Please check your API key.` };
          }
          return { error: `Radarr error: ${error.message}` };
        }
        return {
          error: `Failed to rename movie files: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        };
      }
    },
  });
