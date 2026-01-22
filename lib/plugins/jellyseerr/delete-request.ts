import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { JellyseerrClient } from "./client";

export const deleteRequest = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new JellyseerrClient(config);

  return tool({
    description:
      "Delete/Cancel a request in Jellyseerr. IMPORTANT: You must get the requests list first to find the correct 'requestId'. Do not guess.",
    inputSchema: z.object({
      requestId: z.number().describe("The ID of the request to delete"),
    }),
    execute: async ({ requestId }: { requestId: number }) => {
      await client.delete(`/request/${requestId}`);

      return {
        success: true,
        message: `Request with ID ${requestId} deleted successfully`,
      };
    },
  });
};
