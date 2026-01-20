import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { SonarrClientError, sonarrRequest } from "./client";
import type { SonarrCommand } from "./types";

type RenameEpisodeFilesProps = {
  session: Session;
};

export const renameEpisodeFiles = ({ session }: RenameEpisodeFilesProps) =>
  tool({
    description:
      "Rename episode files to match Sonarr's naming format. You can rename all files for a series or specific episode files. Use getEpisodeFiles first to get file IDs.",
    inputSchema: z.object({
      seriesId: z
        .number()
        .describe("The Sonarr series ID to rename files for"),
      fileIds: z
        .array(z.number())
        .optional()
        .describe(
          "Optional: Specific episode file IDs to rename. If not provided, renames all files that need renaming."
        ),
    }),
    execute: async ({ seriesId, fileIds }) => {
      try {
        const commandBody: {
          name: string;
          seriesId: number;
          files?: number[];
        } = {
          name: "RenameFiles",
          seriesId,
        };

        if (fileIds && fileIds.length > 0) {
          commandBody.files = fileIds;
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
          message: fileIds
            ? `Rename started for ${fileIds.length} file(s). Command ID: ${result.id}`
            : `Rename started for all files needing renaming in series ID ${seriesId}. Command ID: ${result.id}`,
        };
      } catch (error) {
        if (error instanceof SonarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to rename episode files. Please try again." };
      }
    },
  });
