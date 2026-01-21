import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import {
  formatBytes,
  formatEta,
  getStateDescription,
  QBittorrentClient,
} from "./client";
import type { Torrent } from "./types";

export const getTorrents = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new QBittorrentClient(config);

  return tool({
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
        .enum([
          "name",
          "size",
          "progress",
          "dlspeed",
          "upspeed",
          "added_on",
          "eta",
        ])
        .default("added_on")
        .describe("Sort torrents by field"),
    }),
    execute: async ({ filter, limit, sort }) => {
      try {
        const params = buildParams(filter, limit, sort);
        const torrents = await client.get<Torrent[]>("/torrents/info", params);

        if (torrents.length === 0) {
          return {
            torrents: [],
            message:
              filter === "all"
                ? "No torrents found in qBittorrent."
                : `No ${filter} torrents found.`,
          };
        }

        const formattedTorrents = torrents.map(formatTorrent);
        const summary = calculateSummary(torrents);

        return {
          torrents: formattedTorrents,
          summary,
          message: `Found ${torrents.length} torrent${torrents.length === 1 ? "" : "s"}${filter !== "all" ? ` (filtered by: ${filter})` : ""}.`,
        };
      } catch (error) {
        return {
          torrents: [],
          message: `Error getting torrents: ${error instanceof Error ? error.message : "Unknown error"}`,
          summary: { total: 0, downloading: 0, seeding: 0, paused: 0 },
        };
      }
    },
  });
};

function buildParams(
  filter: string,
  limit: number,
  sort: string
): Record<string, string> {
  const params: Record<string, string> = {
    sort,
    reverse: "true",
    limit: limit.toString(),
  };
  if (filter !== "all") {
    params.filter = filter;
  }
  return params;
}

function formatTorrent(t: Torrent) {
  return {
    hash: t.hash,
    name: t.name,
    state: getStateDescription(t.state),
    rawState: t.state,
    progress: `${(t.progress * 100).toFixed(1)}%`,
    progressValue: t.progress,
    size: formatBytes(t.size),
    downloaded: formatBytes(t.downloaded),
    uploaded: formatBytes(t.uploaded),
    downloadSpeed: `${formatBytes(t.dlspeed)}/s`,
    uploadSpeed: `${formatBytes(t.upspeed)}/s`,
    eta: formatEta(t.eta),
    ratio: t.ratio.toFixed(2),
    seeds: t.num_seeds,
    peers: t.num_leechs,
    category: t.category || null,
    addedOn: new Date(t.added_on * 1000).toISOString(),
  };
}

function calculateSummary(torrents: Torrent[]) {
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
    total: torrents.length,
    downloading,
    seeding,
    paused,
  };
}
