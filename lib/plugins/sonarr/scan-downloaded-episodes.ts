import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";
import type { SonarrCommand } from "./types";

export const scanDownloadedEpisodes = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
    description:
      "Scan a download folder for new episode files in Sonarr. This triggers Sonarr to check the specified folder (or all download folders if not specified) for completed downloads that can be imported.",
    inputSchema: z.object({
      path: z
        .string()
        .optional()
        .describe(
          "Optional: The folder path to scan. If not provided, scans all configured download folders."
        ),
    }),
    execute: async ({ path }) => {
      try {
        const commandBody: { name: string; path?: string } = {
          name: "DownloadedEpisodesScan",
        };

        if (path) {
          commandBody.path = path;
        }

        const result = await client.post<SonarrCommand>(
          "/command",
          commandBody
        );

        return {
          success: true,
          commandId: result.id,
          status: result.status,
          message: path
            ? `Scan started for folder: ${path}. Command ID: ${result.id}. Use getCommandStatus to check completion.`
            : `Scan started for all download folders. Command ID: ${result.id}. Use getCommandStatus to check completion.`,
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to scan downloaded episodes: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};
