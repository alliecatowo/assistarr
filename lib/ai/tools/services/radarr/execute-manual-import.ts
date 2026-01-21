import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { RadarrClientError, radarrRequest } from "./client";
import type { RadarrCommand } from "./types";

type ExecuteManualImportProps = {
  session: Session;
};

const manualImportFileSchema = z.object({
  path: z.string().describe("Full path to the file to import"),
  movieId: z
    .number()
    .describe("The Radarr movie ID to associate this file with"),
  quality: z
    .object({
      quality: z.object({
        id: z.number().describe("Quality ID (e.g., 7 for Bluray-1080p)"),
        name: z.string().describe("Quality name"),
      }),
    })
    .describe("Quality information for the file"),
  languages: z
    .array(
      z.object({
        id: z.number().describe("Language ID (e.g., 1 for English)"),
        name: z.string().describe("Language name"),
      })
    )
    .describe("Languages for the file"),
  downloadId: z
    .string()
    .optional()
    .describe("Download client ID if importing from download client"),
});

export const executeManualImport = ({ session }: ExecuteManualImportProps) =>
  tool({
    description:
      "Execute a manual import to associate files with movies. Use getManualImport first to see available files and their detected matches. This is useful for importing files that weren't automatically matched or for fixing incorrect matches. This is a destructive action that will move/copy files.",
    inputSchema: z.object({
      files: z
        .array(manualImportFileSchema)
        .describe("Array of files to import with their movie associations"),
      importMode: z
        .enum(["auto", "move", "copy", "hardlink", "symlink"])
        .optional()
        .default("auto")
        .describe(
          "How to import files: auto (use Radarr settings), move, copy, hardlink, or symlink"
        ),
    }),
    execute: async ({ files, importMode }) => {
      try {
        const command = await radarrRequest<RadarrCommand>(
          session.user.id,
          "/command",
          {
            method: "POST",
            body: JSON.stringify({
              name: "ManualImport",
              files: files.map((f) => ({
                path: f.path,
                movieId: f.movieId,
                quality: f.quality,
                languages: f.languages,
                downloadId: f.downloadId,
              })),
              importMode,
            }),
          }
        );

        return {
          success: true,
          commandId: command.id,
          status: command.status,
          message: `Manual import started for ${files.length} file(s). Command ID: ${command.id}. Use getCommandStatus to check completion.`,
        };
      } catch (error) {
        if (error instanceof RadarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to execute manual import. Please try again." };
      }
    },
  });
