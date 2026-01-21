import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { sonarrRequest } from "./client";
import type { SonarrEpisodeFile } from "./types";

type GetEpisodeFilesProps = {
  session: Session;
};

export const getEpisodeFiles = ({ session }: GetEpisodeFilesProps) =>
  tool({
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
    execute: withToolErrorHandling(
      { serviceName: "Sonarr", operationName: "get episode files" },
      async ({ seriesId, episodeFileId }) => {
        if (!seriesId && !episodeFileId) {
          return {
            error:
              "You must provide either a seriesId or an episodeFileId to get episode file information.",
          };
        }

        if (episodeFileId) {
          const file = await sonarrRequest<SonarrEpisodeFile>(
            session.user.id,
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

        const files = await sonarrRequest<SonarrEpisodeFile[]>(
          session.user.id,
          `/episodefile?seriesId=${seriesId}`
        );

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
      }
    ),
  });

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 B";
  }
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
