import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import {
  formatBytes,
  formatEta,
  getStateDescription,
  QBittorrentClientError,
  qbittorrentRequest,
} from "./client";
import type { Torrent, TorrentFilter } from "./types";

interface GetTorrentsProps {
  session: Session;
}

export const getTorrents = ({ session }: GetTorrentsProps) =>
  tool({
    description:
      "List torrents from qBittorrent. Returns active torrents with name, progress, state, and speeds. Can filter by state (downloading, seeding, paused, etc.).",
    inputSchema: z.object({
      filter: z
        .enum([
          "all",
          "downloading",
          "seeding",
          "completed",
          "paused",
          "active",
          "inactive",
          "resumed",
          "stalled",
          "errored",
        ])
        .default("all")
        .describe("Filter torrents by state"),
      limit: z
        .number()
        .min(1)
        .max(50)
        .default(20)
        .describe("Maximum number of torrents to return"),
      sort: z
        .enum(["name", "size", "progress", "dlspeed", "upspeed", "added_on", "eta"])
        .default("added_on")
        .describe("Sort torrents by field"),
    }),
    execute: async ({ filter, limit, sort }) => {
      try {
        const params = new URLSearchParams();
        if (filter !== "all") {
          params.set("filter", filter);
        }
        params.set("sort", sort);
        params.set("reverse", "true"); // Most recent first for added_on
        params.set("limit", limit.toString());

        const endpoint = `/torrents/info?${params.toString()}`;
        const torrents = await qbittorrentRequest<Torrent[]>(
          session.user.id,
          endpoint
        );

        if (torrents.length === 0) {
          return {
            torrents: [],
            message:
              filter === "all"
                ? "No torrents found in qBittorrent."
                : `No ${filter} torrents found.`,
          };
        }

        const formattedTorrents = torrents.map((t) => ({
          hash: t.hash,
          name: t.name,
          state: getStateDescription(t.state),
          rawState: t.state,
          progress: `${(t.progress * 100).toFixed(1)}%`,
          progressValue: t.progress,
          size: formatBytes(t.size),
          downloaded: formatBytes(t.downloaded),
          uploaded: formatBytes(t.uploaded),
          downloadSpeed: formatBytes(t.dlspeed) + "/s",
          uploadSpeed: formatBytes(t.upspeed) + "/s",
          eta: formatEta(t.eta),
          ratio: t.ratio.toFixed(2),
          seeds: t.num_seeds,
          peers: t.num_leechs,
          category: t.category || null,
          addedOn: new Date(t.added_on * 1000).toISOString(),
        }));

        // Summary statistics
        const downloading = torrents.filter((t) =>
          ["downloading", "metaDL", "stalledDL", "forcedDL"].includes(t.state)
        ).length;
        const seeding = torrents.filter((t) =>
          ["uploading", "stalledUP", "forcedUP"].includes(t.state)
        ).length;
        const paused = torrents.filter((t) =>
          ["pausedDL", "pausedUP"].includes(t.state)
        ).length;

        return {
          torrents: formattedTorrents,
          summary: {
            total: torrents.length,
            downloading,
            seeding,
            paused,
          },
          message: `Found ${torrents.length} torrent${torrents.length === 1 ? "" : "s"}${filter !== "all" ? ` (filtered by: ${filter})` : ""}.`,
        };
      } catch (error) {
        if (error instanceof QBittorrentClientError) {
          return { error: error.message };
        }
        return { error: "Failed to get torrents from qBittorrent. Please try again." };
      }
    },
  });
