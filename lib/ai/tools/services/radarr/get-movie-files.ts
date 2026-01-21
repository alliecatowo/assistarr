import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { RadarrClientError, radarrRequest } from "./client";
import type { RadarrMovieFile } from "./types";

type GetMovieFilesProps = {
  session: Session;
};

export const getMovieFiles = ({ session }: GetMovieFilesProps) =>
  tool({
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
        const endpoint = movieId
          ? `/moviefile?movieId=${movieId}`
          : "/moviefile";

        const files = await radarrRequest<RadarrMovieFile[]>(
          session.user.id,
          endpoint
        );

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
        if (error instanceof RadarrClientError) {
          if (error.statusCode === 404) {
            return { error: movieId ? `Movie with ID ${movieId} not found in Radarr.` : `Radarr endpoint not found.` };
          }
          if (error.statusCode === 401 || error.statusCode === 403) {
            return { error: `Radarr authentication failed: ${error.message}. Please check your API key.` };
          }
          return { error: `Radarr error: ${error.message}` };
        }
        return {
          error: `Failed to get movie files: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        };
      }
    },
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
