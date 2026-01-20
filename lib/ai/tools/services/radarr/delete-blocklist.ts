import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { RadarrClientError, radarrRequest } from "./client";

type DeleteBlocklistProps = {
  session: Session;
};

export const deleteBlocklist = ({ session }: DeleteBlocklistProps) =>
  tool({
    description:
      "Remove items from the blocklist, allowing Radarr to grab those releases again. Use getBlocklist first to find the blocklist item IDs. Can remove a single item or multiple items at once.",
    inputSchema: z.object({
      id: z
        .number()
        .optional()
        .describe(
          "Single blocklist item ID to remove (use this OR ids, not both)"
        ),
      ids: z
        .array(z.number())
        .optional()
        .describe(
          "Array of blocklist item IDs to remove in bulk (use this OR id, not both)"
        ),
    }),
    execute: async ({ id, ids }) => {
      try {
        if (!id && (!ids || ids.length === 0)) {
          return {
            error: "Please provide either 'id' for a single item or 'ids' for bulk removal.",
          };
        }

        if (id && ids && ids.length > 0) {
          return {
            error: "Please provide either 'id' or 'ids', not both.",
          };
        }

        if (id) {
          // Single item deletion
          await radarrRequest(session.user.id, `/blocklist/${id}`, {
            method: "DELETE",
          });

          return {
            success: true,
            message: `Blocklist item ${id} removed successfully.`,
          };
        }

        // Bulk deletion
        await radarrRequest(session.user.id, "/blocklist/bulk", {
          method: "DELETE",
          body: JSON.stringify({ ids }),
        });

        return {
          success: true,
          message: `Removed ${ids!.length} item(s) from the blocklist.`,
        };
      } catch (error) {
        if (error instanceof RadarrClientError) {
          return { error: error.message };
        }
        return {
          error: "Failed to remove from blocklist. Please try again.",
        };
      }
    },
  });
