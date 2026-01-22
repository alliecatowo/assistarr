import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";

export const deleteEpisodeFile = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
    description:
      "Delete an episode file from disk and remove it from Sonarr. IMPORTANT: This permanently deletes the file. Use getEpisodeFiles first to get the file ID.",
    inputSchema: z.object({
      fileId: z
        .number()
        .describe(
          "The episode file ID to delete (from getEpisodeFiles, this is the 'id' field)"
        ),
    }),
    execute: async ({ fileId }) => {
      await client.delete(`/episodefile/${fileId}`);

      return {
        success: true,
        message: `Successfully deleted episode file with ID ${fileId}.`,
      };
    },
  });
};
