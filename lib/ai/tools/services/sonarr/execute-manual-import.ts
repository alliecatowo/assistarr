import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { SonarrClientError, sonarrRequest } from "./client";
import type { SonarrCommand } from "./types";

type ExecuteManualImportProps = {
  session: Session;
};

export const executeManualImport = ({ session }: ExecuteManualImportProps) =>
  tool({
    description:
      "Execute a manual import to associate files with episodes in Sonarr. Use getManualImport first to see available files. This is useful when automatic import fails or files need to be manually matched to episodes.",
    inputSchema: z.object({
      files: z
        .array(
          z.object({
            path: z.string().describe("The full path to the file to import"),
            seriesId: z.number().describe("The Sonarr series ID"),
            seasonNumber: z.number().describe("The season number"),
            episodeIds: z
              .array(z.number())
              .describe("Array of episode IDs to associate with this file"),
            quality: z
              .object({
                quality: z.object({
                  id: z.number().describe("Quality ID"),
                  name: z.string().describe("Quality name"),
                }),
              })
              .describe("Quality object from getManualImport"),
            languages: z
              .array(
                z.object({
                  id: z.number(),
                  name: z.string(),
                })
              )
              .optional()
              .default([{ id: 1, name: "English" }])
              .describe("Languages for the file"),
            releaseGroup: z
              .string()
              .optional()
              .describe("The release group name"),
            downloadId: z
              .string()
              .optional()
              .describe("The download client ID if from a download"),
          })
        )
        .describe("Array of files to import with their episode mappings"),
      importMode: z
        .enum(["auto", "move", "copy", "hardlink", "symlink"])
        .optional()
        .default("auto")
        .describe(
          "How to import the files (default: auto - uses Sonarr settings)"
        ),
    }),
    execute: async ({ files, importMode }) => {
      try {
        const commandBody = {
          name: "ManualImport",
          files: files.map((file) => ({
            path: file.path,
            seriesId: file.seriesId,
            seasonNumber: file.seasonNumber,
            episodeIds: file.episodeIds,
            quality: file.quality,
            languages: file.languages,
            releaseGroup: file.releaseGroup,
            downloadId: file.downloadId,
          })),
          importMode,
        };

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
          status: result.status,
          message: `Manual import started for ${files.length} file(s). Command ID: ${result.id}. Use getCommandStatus to check completion.`,
        };
      } catch (error) {
        if (error instanceof SonarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to execute manual import. Please try again." };
      }
    },
  });
