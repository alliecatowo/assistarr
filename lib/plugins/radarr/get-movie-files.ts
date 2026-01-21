import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";
import type { RadarrMovieFile } from "./types";

export const getMovieFiles = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
    description:
      "Get file information for movies in the library. Returns details like file path, size, quality, and media info. Can get all files or filter by a specific movie ID.",
    inputSchema: z.object({
      movieId: z
        .number()
        .optional()
        .describe(
          "Optional movie ID to get files for a specific movie. If not provided, returns all movie files."
        ),
    }),
    execute: async ({ movieId }) => {
      try {
        const params: Record<string, string | number> = {};
        if (movieId) {
          params.movieId = movieId;
        }

        const files = await client.get<RadarrMovieFile[]>("/moviefile", params);

        if (files.length === 0) {
          return {
            files: [],
            message: movieId
              ? "No files found for this movie."
              : "No movie files found in the library.",
          };
        }

        const formattedFiles = files.map((file) => ({
          id: file.id,
          movieId: file.movieId,
          path: file.path,
          relativePath: file.relativePath,
          size: formatBytes(file.size),
          sizeBytes: file.size,
          quality: file.quality.quality.name,
          dateAdded: file.dateAdded,
          sceneName: file.sceneName,
          releaseGroup: file.releaseGroup,
          mediaInfo: file.mediaInfo
            ? {
                videoCodec: file.mediaInfo.videoCodec,
                audioCodec: file.mediaInfo.audioCodec,
                audioChannels: file.mediaInfo.audioChannels,
                resolution: file.mediaInfo.resolution,
                runTime: file.mediaInfo.runTime,
                audioLanguages: file.mediaInfo.audioLanguages,
                subtitles: file.mediaInfo.subtitles,
              }
            : null,
        }));

        return {
          files: formattedFiles,
          totalFiles: files.length,
          message: `Found ${files.length} movie file(s).`,
        };
      } catch (error) {
        return {
          files: [],
          message: `Error getting movie files: ${error instanceof Error ? error.message : "Unknown error"}`,
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
