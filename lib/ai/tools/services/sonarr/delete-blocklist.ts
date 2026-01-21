import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { sonarrRequest } from "./client";

type DeleteBlocklistProps = {
  session: Session;
};

export const deleteBlocklist = ({ session }: DeleteBlocklistProps) =>
  tool({
    description:
      "Remove a release from the blocklist in Sonarr. This allows the release to be grabbed again if it appears in searches. Use getBlocklist first to get the blocklist item ID.",
    inputSchema: z.object({
      blocklistId: z
        .number()
        .optional()
        .describe(
          "The blocklist item ID to remove (from getBlocklist, this is the 'id' field)"
        ),
      blocklistIds: z
        .array(z.number())
        .optional()
        .describe("Array of blocklist item IDs to remove in bulk"),
    }),
    execute: withToolErrorHandling(
      { serviceName: "Sonarr", operationName: "delete blocklist" },
      async ({ blocklistId, blocklistIds }) => {
        if (!blocklistId && (!blocklistIds || blocklistIds.length === 0)) {
          return {
            error:
              "You must provide either a blocklistId or an array of blocklistIds to remove.",
          };
        }

        if (blocklistIds && blocklistIds.length > 0) {
          await sonarrRequest(session.user.id, "/blocklist/bulk", {
            method: "DELETE",
            body: JSON.stringify({ ids: blocklistIds }),
          });

          return {
            success: true,
            message: `Successfully removed ${blocklistIds.length} item(s) from the blocklist.`,
          };
        }

        await sonarrRequest(session.user.id, `/blocklist/${blocklistId}`, {
          method: "DELETE",
        });

        return {
          success: true,
          message: `Successfully removed item ${blocklistId} from the blocklist.`,
        };
      }
    ),
  });
