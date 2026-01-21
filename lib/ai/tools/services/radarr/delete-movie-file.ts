import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { RadarrClientError, radarrRequest } from "./client";

type DeleteMovieFileProps = {
  session: Session;
};

export const deleteMovieFile = ({ session }: DeleteMovieFileProps) =>
  tool({
    description:
      "Delete a specific movie file from disk. IMPORTANT: Use getMovieFiles first to get the correct file ID. This permanently deletes the file and cannot be undone.",
    inputSchema: z.object({
      fileId: z
        .number()
        .describe(
          "The file ID to delete (from getMovieFiles, this is the 'id' field)"
        ),
    }),
    execute: async ({ fileId }) => {
      try {
        await radarrRequest(session.user.id, `/moviefile/${fileId}`, {
          method: "DELETE",
        });

        return {
          success: true,
          message: `Movie file with ID ${fileId} deleted successfully.`,
        };
      } catch (error) {
        if (error instanceof RadarrClientError) {
          if (error.statusCode === 404) {
            return { error: `File with ID ${fileId} not found. It may have already been deleted.` };
          }
          if (error.statusCode === 401 || error.statusCode === 403) {
            return { error: `Radarr authentication failed: ${error.message}. Please check your API key.` };
          }
          return { error: `Radarr error: ${error.message}` };
        }
        return {
          error: `Failed to delete movie file: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        };
      }
    },
  });
