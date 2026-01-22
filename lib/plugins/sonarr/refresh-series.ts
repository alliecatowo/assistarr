import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";

export const refreshSeries = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
    description: "Refresh a series' metadata and scan for files in Sonarr.",
    inputSchema: z.object({
      seriesId: z.number().describe("The Sonarr series ID to refresh"),
    }),
    execute: async ({ seriesId }) => {
      try {
        await client.post("/command", {
          name: "RefreshSeries",
          seriesId,
        });

        return {
          success: true,
          message: `Refresh triggered for series ID ${seriesId}.`,
        };
      } catch (error) {
        return {
          success: false,
          error: `Failed to refresh series: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};
