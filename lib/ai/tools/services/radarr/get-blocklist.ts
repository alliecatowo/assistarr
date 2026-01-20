import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { RadarrClientError, radarrRequest } from "./client";
import type { RadarrBlocklistResponse } from "./types";

type GetBlocklistProps = {
  session: Session;
};

export const getBlocklist = ({ session }: GetBlocklistProps) =>
  tool({
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
        const params = new URLSearchParams({
          page: "1",
          pageSize: String(Math.min(pageSize, 100)),
          sortKey: "date",
          sortDirection: "descending",
        });

        const blocklist = await radarrRequest<RadarrBlocklistResponse>(
          session.user.id,
          `/blocklist?${params.toString()}`
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
        if (error instanceof RadarrClientError) {
          return { error: error.message };
        }
        return { error: "Failed to get blocklist. Please try again." };
      }
    },
  });
