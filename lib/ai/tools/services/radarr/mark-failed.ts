import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { radarrRequest } from "./client";

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
    execute: withToolErrorHandling(
      { serviceName: "Radarr", operationName: "mark as failed" },
      async ({ historyId }) => {
        await radarrRequest(session.user.id, `/history/failed/${historyId}`, {
          method: "POST",
        });

        return {
          success: true,
          message: `History item ${historyId} marked as failed. Radarr will search for an alternative release.`,
        };
      }
    ),
  });
