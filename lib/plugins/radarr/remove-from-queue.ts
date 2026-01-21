import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";

export const removeFromQueue = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
    description:
      "Remove a stalled or failed item from the download queue. Use this before grabbing a new release for the same movie. The queue item ID comes from getQueue. You can optionally blocklist the release to prevent it from being grabbed again.",
    inputSchema: z.object({
      queueId: z
        .number()
        .describe(
          "The queue item ID to remove (from getQueue, this is the 'id' field)"
        ),
      removeFromClient: z
        .boolean()
        .optional()
        .default(true)
        .describe(
          "Whether to also remove from the download client (default: true)"
        ),
      blocklist: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          "Whether to blocklist this release to prevent re-grabbing (default: false)"
        ),
    }),
    execute: async ({ queueId, removeFromClient, blocklist }) => {
      try {
        await client.delete(`/api/v3/queue/${queueId}`, {
          removeFromClient,
          blocklist,
        });

        return {
          success: true,
          message: `Removed item from queue.${blocklist ? " The release has been blocklisted." : ""}`,
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to remove item from queue: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};
