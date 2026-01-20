import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { RadarrClientError, radarrRequest } from "./client";
import type { RadarrCommand } from "./types";

type ScanDownloadedMoviesProps = {
  session: Session;
};

export const scanDownloadedMovies = ({ session }: ScanDownloadedMoviesProps) =>
  tool({
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
          message: folder
            ? `Scan started for folder: ${folder}. Command ID: ${command.id}`
            : `Download folder scan started. Command ID: ${command.id}`,
        };
      } catch (error) {
        if (error instanceof RadarrClientError) {
          return { error: error.message };
        }
        return {
          error: "Failed to start downloaded movies scan. Please try again.",
        };
      }
    },
  });
