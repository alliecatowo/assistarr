import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";

export const deleteBlocklist = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
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
    execute: async ({ blocklistId, blocklistIds }) => {
      try {
        if (!blocklistId && (!blocklistIds || blocklistIds.length === 0)) {
          return {
            error:
              "You must provide either a blocklistId or an array of blocklistIds to remove.",
          };
        }

        if (blocklistIds && blocklistIds.length > 0) {
          await client.delete("/api/v3/blocklist/bulk", undefined, {
            ids: blocklistIds,
          });

          return {
            success: true,
            message: `Successfully removed ${blocklistIds.length} item(s) from the blocklist.`,
          };
        }

        if (blocklistId) {
          await client.delete(`/api/v3/blocklist/${blocklistId}`);
          return {
            success: true,
            message: `Successfully removed item ${blocklistId} from the blocklist.`,
          };
        }

        return { error: "No blocklist ID provided." };
      } catch (error) {
        return {
          success: false,
          error: `Failed to remove from blocklist: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};
