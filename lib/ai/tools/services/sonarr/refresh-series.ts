import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { SonarrClientError, sonarrRequest } from "./client";

type RefreshSeriesProps = {
  session: Session;
};

export const refreshSeries = ({ session }: RefreshSeriesProps) =>
  tool({
    description: "Refresh a series' metadata and scan for files in Sonarr.",
    inputSchema: z.object({
      seriesId: z.number().describe("The Sonarr series ID to refresh"),
    }),
    execute: async ({ seriesId }) => {
      try {
        await sonarrRequest(session.user.id, "/command", {
          method: "POST",
          body: JSON.stringify({
            name: "RefreshSeries",
            seriesId,
          }),
        });

        return {
          success: true,
          message: `Refresh triggered for series ID ${seriesId}.`,
        };
      } catch (error) {
        if (error instanceof SonarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to refresh series. Please try again." };
      }
    },
  });
