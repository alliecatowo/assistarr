import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";

export const deleteBlocklist = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
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
      if (!id && (!ids || ids.length === 0)) {
        throw new Error(
          "Please provide either 'id' for a single item or 'ids' for bulk removal."
        );
      }

      if (id && ids && ids.length > 0) {
        throw new Error("Please provide either 'id' or 'ids', not both.");
      }

      if (id) {
        await client.delete(`/blocklist/${id}`);

        return {
          success: true,
          message: `Blocklist item ${id} removed successfully.`,
        };
      }

      await client.delete("/blocklist/bulk", {
        body: JSON.stringify({ ids }),
      });

      return {
        success: true,
        message: `Removed ${ids?.length} item(s) from the blocklist.`,
      };
    },
  });
};
