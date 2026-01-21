import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { RadarrClient } from "./client";
import type { RadarrBlocklistResponse } from "./types";

export const getBlocklist = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new RadarrClient(config);

  return tool({
    description:
      "Get the list of blocklisted releases. These are releases that Radarr will not grab again due to previous failures or manual blocking.",
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
        const params = {
          page: 1,
          pageSize: Math.min(pageSize, 100),
          sortKey: "date",
          sortDirection: "descending",
        };

        const blocklist = await client.get<RadarrBlocklistResponse>(
          "/blocklist",
          params
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
          movieId: item.movieId,
          movieTitle: item.movie?.title ?? "Unknown",
          movieYear: item.movie?.year,
          sourceTitle: item.sourceTitle,
          quality: item.quality.quality.name,
          languages: item.languages.map((l) => l.name).join(", "),
          date: item.date,
          protocol: item.protocol,
          indexer: item.indexer,
          message: item.message,
        }));

        return {
          items,
          totalRecords: blocklist.totalRecords,
          page: blocklist.page,
          pageSize: blocklist.pageSize,
          message: `Found ${blocklist.totalRecords} blocklisted release(s).`,
        };
      } catch (error) {
        return {
          items: [],
          totalRecords: 0,
          message: `Error getting blocklist: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};
