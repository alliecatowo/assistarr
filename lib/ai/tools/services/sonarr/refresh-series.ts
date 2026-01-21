import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { sonarrRequest } from "./client";

type RefreshSeriesProps = {
  session: Session;
};

export const refreshSeries = ({ session }: RefreshSeriesProps) =>
  tool({
    description: "Refresh a series' metadata and scan for files in Sonarr.",
    inputSchema: z.object({
      seriesId: z.number().describe("The Sonarr series ID to refresh"),
    }),
    execute: withToolErrorHandling(
      { serviceName: "Sonarr", operationName: "refresh series" },
      async ({ seriesId }) => {
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
      }
    ),
  });
