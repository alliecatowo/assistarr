import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { SonarrClientError, sonarrRequest } from "./client";
import type { SonarrCommand } from "./types";

type ScanDownloadedEpisodesProps = {
  session: Session;
};

export const scanDownloadedEpisodes = ({
  session,
}: ScanDownloadedEpisodesProps) =>
  tool({
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

        const result = await sonarrRequest<SonarrCommand>(
          session.user.id,
          "/command",
          {
            method: "POST",
            body: JSON.stringify(commandBody),
          }
        );

        return {
          success: true,
          commandId: result.id,
          message: path
            ? `Scan started for folder: ${path}. Command ID: ${result.id}`
            : `Scan started for all download folders. Command ID: ${result.id}`,
        };
      } catch (error) {
        if (error instanceof SonarrClientError) {
          return { error: error.message };
        }
        return {
          error: "Failed to start download folder scan. Please try again.",
        };
      }
    },
  });
