import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { jellyseerrRequest } from "./client";

type DeleteRequestProps = {
  session: Session;
};

export const deleteRequest = ({ session }: DeleteRequestProps) =>
  tool({
    description:
      "Delete/Cancel a request in Jellyseerr. IMPORTANT: You must get the requests list first to find the correct 'requestId'. Do not guess.",
    inputSchema: z.object({
      requestId: z.number().describe("The ID of the request to delete"),
    }),
    execute: async ({ requestId }: { requestId: number }) => {
      try {
        await jellyseerrRequest(session.user.id, `/request/${requestId}`, {
          method: "DELETE",
        });

        return {
          success: true,
          message: `Request with ID ${requestId} deleted successfully`,
        };
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : "Refused to delete request",
        };
      }
    },
  });
