import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { RadarrClientError, radarrRequest } from "./client";

type MarkFailedProps = {
  session: Session;
};

export const markFailed = ({ session }: MarkFailedProps) =>
  tool({
    description:
      "Mark a history item as failed. This allows Radarr to search for and grab an alternative release. Use getHistory first to find the history ID of the download you want to mark as failed.",
    inputSchema: z.object({
      historyId: z
        .number()
        .describe(
          "The history record ID to mark as failed (from getHistory, this is the 'id' field)"
        ),
    }),
    execute: async ({ historyId }) => {
      try {
        await radarrRequest(session.user.id, `/history/failed/${historyId}`, {
          method: "POST",
        });

        return {
          success: true,
          message: `History item ${historyId} marked as failed. Radarr will search for an alternative release.`,
        };
      } catch (error) {
        if (error instanceof RadarrClientError) {
          if (error.statusCode === 404) {
            return { error: `History item with ID ${historyId} not found.` };
          }
          if (error.statusCode === 401 || error.statusCode === 403) {
            return { error: `Radarr authentication failed: ${error.message}. Please check your API key.` };
          }
          return { error: `Radarr error: ${error.message}` };
        }
        return {
          error: `Failed to mark as failed: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        };
      }
    },
  });
