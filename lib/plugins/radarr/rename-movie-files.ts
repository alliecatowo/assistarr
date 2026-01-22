import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";
import type { RadarrCommand } from "./types";

export const renameMovieFiles = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
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
      const commandBody: Record<string, unknown> = {
        name: "RenameFiles",
        movieId,
      };

      if (fileIds && fileIds.length > 0) {
        commandBody.files = fileIds;
      }

      const command = await client.post<RadarrCommand>("/command", commandBody);

      return {
        success: true,
        commandId: command.id,
        status: command.status,
        message: fileIds
          ? `Rename started for ${fileIds.length} file(s). Command ID: ${command.id}`
          : `Rename started for all files of movie ${movieId}. Command ID: ${command.id}`,
      };
    },
  });
};
