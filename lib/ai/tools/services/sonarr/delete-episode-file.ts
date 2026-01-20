import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { SonarrClientError, sonarrRequest } from "./client";

type DeleteEpisodeFileProps = {
  session: Session;
};

export const deleteEpisodeFile = ({ session }: DeleteEpisodeFileProps) =>
  tool({
    description:
      "Delete an episode file from disk and remove it from Sonarr. IMPORTANT: This permanently deletes the file. Use getEpisodeFiles first to get the file ID.",
    inputSchema: z.object({
      fileId: z
        .number()
        .describe(
          "The episode file ID to delete (from getEpisodeFiles, this is the 'id' field)"
        ),
    }),
    execute: async ({ fileId }) => {
      try {
        await sonarrRequest(session.user.id, `/episodefile/${fileId}`, {
          method: "DELETE",
        });

        return {
          success: true,
          message: `Successfully deleted episode file with ID ${fileId}.`,
        };
      } catch (error) {
        if (error instanceof SonarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to delete episode file. Please try again." };
      }
    },
  });
