import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { sonarrRequest } from "./client";

type RemoveFromQueueProps = {
  session: Session;
};

export const removeFromQueue = ({ session }: RemoveFromQueueProps) =>
  tool({
    description:
      "Remove a stalled or failed item from the download queue. Use this before grabbing a new release for the same episode. The queue item ID comes from getSonarrQueue. You can optionally blocklist the release to prevent it from being grabbed again.",
    inputSchema: z.object({
      queueId: z
        .number()
        .describe(
          "The queue item ID to remove (from getSonarrQueue, this is the 'id' field)"
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
    execute: withToolErrorHandling(
      { serviceName: "Sonarr", operationName: "remove from queue" },
      async ({ queueId, removeFromClient, blocklist }) => {
        await sonarrRequest(
          session.user.id,
          `/queue/${queueId}?removeFromClient=${removeFromClient}&blocklist=${blocklist}`,
          {
            method: "DELETE",
          }
        );

        return {
          success: true,
          message: `Removed item from queue.${blocklist ? " The release has been blocklisted." : ""}`,
        };
      }
    ),
  });
