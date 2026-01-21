import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { sonarrRequest } from "./client";
import type { SonarrBlocklistResponse } from "./types";

type GetBlocklistProps = {
  session: Session;
};

export const getBlocklist = ({ session }: GetBlocklistProps) =>
  tool({
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
    execute: withToolErrorHandling(
      { serviceName: "Sonarr", operationName: "get blocklist" },
      async ({ pageSize }) => {
        const blocklist = await sonarrRequest<SonarrBlocklistResponse>(
          session.user.id,
          `/blocklist?page=1&pageSize=${Math.min(pageSize, 100)}&sortKey=date&sortDirection=descending`
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
      }
    ),
  });
