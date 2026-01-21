import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { sonarrRequest } from "./client";

type MarkFailedProps = {
  session: Session;
};

export const markFailed = ({ session }: MarkFailedProps) =>
  tool({
    description:
      "Mark a history item as failed in Sonarr. This tells Sonarr that a download failed so it can search for an alternative. Use getHistory first to get the history ID of a 'grabbed' event.",
    inputSchema: z.object({
      historyId: z
        .number()
        .describe(
          "The history record ID to mark as failed (from getHistory, this is the 'id' field of a 'grabbed' event)"
        ),
    }),
    execute: withToolErrorHandling(
      { serviceName: "Sonarr", operationName: "mark failed" },
      async ({ historyId }) => {
        await sonarrRequest(session.user.id, `/history/failed/${historyId}`, {
          method: "POST",
        });

        return {
          success: true,
          message: `Marked history item ${historyId} as failed. Sonarr may now search for an alternative.`,
        };
      }
    ),
  });
