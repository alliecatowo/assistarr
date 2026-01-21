import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";
import type { RadarrCommand } from "./types";

export const scanDownloadedMovies = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
    description:
      "Trigger a scan of the download folder for newly downloaded movie files. Radarr will check for completed downloads and import them. Optionally specify a specific folder to scan.",
    inputSchema: z.object({
      folder: z
        .string()
        .optional()
        .describe(
          "Optional specific folder path to scan. If not provided, scans the default download folder."
        ),
    }),
    execute: async ({ folder }) => {
      try {
        const commandBody: Record<string, unknown> = {
          name: "DownloadedMoviesScan",
        };

        if (folder) {
          commandBody.path = folder;
        }

        const command = await client.post<RadarrCommand>(
          "/command",
          commandBody
        );

        return {
          success: true,
          commandId: command.id,
          status: command.status,
          message: folder
            ? `Scan started for folder: ${folder}. Command ID: ${command.id}. Use getCommandStatus to check completion.`
            : `Download folder scan started. Command ID: ${command.id}. Use getCommandStatus to check completion.`,
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to scan downloaded movies: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};
