import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";
import type { SonarrEpisodeFile } from "./types";

export const getEpisodeFiles = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
    description:
      "Get episode file information from Sonarr. You can get all files for a series or details about a specific episode file. Use this to see file quality, size, and path information.",
    inputSchema: z.object({
      seriesId: z
        .number()
        .optional()
        .describe("The Sonarr series ID to get all episode files for"),
      episodeFileId: z
        .number()
        .optional()
        .describe("A specific episode file ID to get details for"),
    }),
    execute: async ({ seriesId, episodeFileId }) => {
      try {
        if (!seriesId && !episodeFileId) {
          return {
            error:
              "You must provide either a seriesId or an episodeFileId to get episode file information.",
          };
        }

        if (episodeFileId) {
          const file = await client.get<SonarrEpisodeFile>(
            `/episodefile/${episodeFileId}`
          );

          return {
            file: {
              id: file.id,
              seriesId: file.seriesId,
              seasonNumber: file.seasonNumber,
              path: file.path,
              relativePath: file.relativePath,
              size: formatBytes(file.size),
              quality: file.quality.quality.name,
              dateAdded: file.dateAdded,
            },
            message: `Found episode file: ${file.relativePath}`,
          };
        }

        const files = await client.get<SonarrEpisodeFile[]>("/episodefile", {
          seriesId,
        });

        if (files.length === 0) {
          return {
            files: [],
            totalFiles: 0,
            message: "No episode files found for this series.",
          };
        }

        const formattedFiles = files.map((file) => ({
          id: file.id,
          seasonNumber: file.seasonNumber,
          path: file.path,
          relativePath: file.relativePath,
          size: formatBytes(file.size),
          quality: file.quality.quality.name,
          dateAdded: file.dateAdded,
        }));

        return {
          files: formattedFiles,
          totalFiles: files.length,
          message: `Found ${files.length} episode file(s) for series ID ${seriesId}.`,
        };
      } catch (error) {
        return {
          files: [],
          message: `Error getting episode files: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
