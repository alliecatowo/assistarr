import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { SonarrClient } from "./client";
import type { SonarrBlocklistResponse } from "./types";

export const getBlocklist = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new SonarrClient(config);

  return tool({
    description:
      "Get the list of blocklisted releases in Sonarr. Blocklisted releases will not be grabbed again. Use this to see what releases have been blocked and why.",
    inputSchema: z.object({
      pageSize: z
        .number()
        .optional()
        .default(20)
        .describe(
          "Number of blocklist items to return (default: 20, max: 100)"
        ),
    }),
    execute: async ({ pageSize }) => {
      try {
        const blocklist = await client.get<SonarrBlocklistResponse>(
          "/blocklist",
          {
            page: 1,
            pageSize: Math.min(pageSize, 100),
            sortKey: "date",
            sortDirection: "descending",
          }
        );

        if (blocklist.totalRecords === 0) {
          return {
            items: [],
            totalRecords: 0,
            message: "No blocklisted releases found.",
          };
        }

        const items = blocklist.records.map((item) => ({
          id: item.id,
          seriesTitle: item.series?.title ?? "Unknown Series",
          seriesId: item.seriesId,
          sourceTitle: item.sourceTitle,
          quality: item.quality.quality.name,
          protocol: item.protocol,
          indexer: item.indexer,
          message: item.message,
          date: item.date,
        }));

        return {
          items,
          totalRecords: blocklist.totalRecords,
          message: `Found ${blocklist.totalRecords} blocklisted release(s).`,
        };
      } catch (error) {
        return {
          items: [],
          message: `Error getting blocklist: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};
