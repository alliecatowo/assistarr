import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";

export const markFailed = ({ session: _session, config }: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
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
      await client.post(`/history/failed/${historyId}`, {});

      return {
        success: true,
        message: `History item ${historyId} marked as failed. Radarr will search for an alternative release.`,
      };
    },
  });
};
