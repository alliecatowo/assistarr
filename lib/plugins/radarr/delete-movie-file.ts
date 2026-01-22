import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";

export const deleteMovieFile = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
    description:
      "Delete a specific movie file from disk. IMPORTANT: Use getMovieFiles first to get the correct file ID. This permanently deletes the file and cannot be undone.",
    inputSchema: z.object({
      fileId: z
        .number()
        .describe(
          "The file ID to delete (from getMovieFiles, this is the 'id' field)"
        ),
    }),
    execute: async ({ fileId }) => {
      await client.delete(`/moviefile/${fileId}`);

      return {
        success: true,
        message: `Movie file with ID ${fileId} deleted successfully.`,
      };
    },
  });
};
