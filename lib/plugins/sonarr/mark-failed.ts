import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";

export const markFailed = ({ session: _session, config }: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
    description:
      "Mark a history item as failed in Sonarr. This tells Sonarr that a download failed so it can search for an alternative. Use getHistory first to get the history ID of a 'grabbed' event.",
    inputSchema: z.object({
      historyId: z
        .number()
        .describe(
          "The history record ID to mark as failed (from getHistory, this is the 'id' field of a 'grabbed' event)"
        ),
    }),
    execute: async ({ historyId }) => {
      await client.post(`/history/failed/${historyId}`);

      return {
        success: true,
        message: `Marked history item ${historyId} as failed. Sonarr may now search for an alternative.`,
      };
    },
  });
};
