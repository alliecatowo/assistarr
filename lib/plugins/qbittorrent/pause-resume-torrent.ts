import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { QBittorrentClient } from "./client";
import type { Torrent } from "./types";

export const pauseResumeTorrent = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new QBittorrentClient(config);

  return tool({
    description:
      "Pause or resume a torrent in qBittorrent. Requires the torrent hash (from getTorrents) and the action to perform. Can also pause/resume all torrents.",
    inputSchema: z.object({
      hash: z
        .string()
        .describe(
          "The torrent hash to pause/resume, or 'all' to affect all torrents"
        ),
      action: z
        .enum(["pause", "resume"])
        .describe("The action to perform: pause or resume"),
    }),
    execute: async ({ hash, action }) => {
      try {
        return await performTorrentAction(client, hash, action);
      } catch (error) {
        return {
          success: false,
          message: `Error pausing/resuming torrent: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    },
  });
};

async function performTorrentAction(
  client: QBittorrentClient,
  hash: string,
  action: "pause" | "resume"
) {
  const endpoint = action === "pause" ? "/torrents/pause" : "/torrents/resume";

  if (hash === "all") {
    await client.postForm(endpoint, { hashes: "all" });
    return {
      success: true,
      action,
      message: `Successfully ${action === "pause" ? "paused" : "resumed"} all torrents.`,
    };
  }

  const preCheck = await checkTorrentState(client, hash, action);
  if (!preCheck.success) {
    return preCheck;
  }

  await client.postForm(endpoint, { hashes: hash });

  // Verify state change
  const updatedTorrents = await client.get<Torrent[]>("/torrents/info", {
    hashes: hash,
  });
  if (updatedTorrents.length > 0) {
    const torrent = updatedTorrents[0];
    return {
      success: true,
      action,
      message: `Successfully ${action === "pause" ? "paused" : "resumed"} torrent "${torrent.name}".`,
      torrent: {
        hash: torrent.hash,
        name: torrent.name,
        state: torrent.state,
      },
    };
  }

  return {
    success: true,
    action,
    message: `Successfully ${action === "pause" ? "paused" : "resumed"} torrent.`,
  };
}

async function checkTorrentState(
  client: QBittorrentClient,
  hash: string,
  action: "pause" | "resume"
) {
  const torrents = await client.get<Torrent[]>("/torrents/info", {
    hashes: hash,
  });

  if (torrents.length === 0) {
    return {
      success: false,
      message: `Torrent with hash "${hash}" not found. Please check the hash and try again.`,
    };
  }

  const torrent = torrents[0];
  const isPaused = ["pausedDL", "pausedUP"].includes(torrent.state);

  if (action === "pause" && isPaused) {
    return {
      success: false,
      message: `Torrent "${torrent.name}" is already paused.`,
      torrent: { hash: torrent.hash, name: torrent.name, state: torrent.state },
    };
  }
  if (action === "resume" && !isPaused) {
    return {
      success: false,
      message: `Torrent "${torrent.name}" is not paused (current state: ${torrent.state}).`,
      torrent: { hash: torrent.hash, name: torrent.name, state: torrent.state },
    };
  }

  return { success: true };
}
