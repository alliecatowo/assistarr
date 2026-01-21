import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { withToolErrorHandling } from "../core";
import { qbittorrentPostForm, qbittorrentRequest } from "./client";
import type { Torrent } from "./types";

interface PauseResumeTorrentProps {
  session: Session;
}

export const pauseResumeTorrent = ({ session }: PauseResumeTorrentProps) =>
  tool({
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
    needsApproval: true,
    execute: withToolErrorHandling(
      { serviceName: "qBittorrent", operationName: "pause/resume torrent" },
      async ({ hash, action }) => {
        if (hash !== "all") {
          const torrents = await qbittorrentRequest<Torrent[]>(
            session.user.id,
            `/torrents/info?hashes=${hash}`
          );

          if (torrents.length === 0) {
            return {
              error: `Torrent with hash "${hash}" not found. Please check the hash and try again.`,
            };
          }

          const torrent = torrents[0];
          const torrentName = torrent.name;

          const isPaused = ["pausedDL", "pausedUP"].includes(torrent.state);
          if (action === "pause" && isPaused) {
            return {
              success: false,
              message: `Torrent "${torrentName}" is already paused.`,
              torrent: {
                hash: torrent.hash,
                name: torrentName,
                state: torrent.state,
              },
            };
          }
          if (action === "resume" && !isPaused) {
            return {
              success: false,
              message: `Torrent "${torrentName}" is not paused (current state: ${torrent.state}).`,
              torrent: {
                hash: torrent.hash,
                name: torrentName,
                state: torrent.state,
              },
            };
          }
        }

        const endpoint =
          action === "pause" ? "/torrents/pause" : "/torrents/resume";

        await qbittorrentPostForm(session.user.id, endpoint, {
          hashes: hash,
        });

        if (hash !== "all") {
          const updatedTorrents = await qbittorrentRequest<Torrent[]>(
            session.user.id,
            `/torrents/info?hashes=${hash}`
          );

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
        }

        return {
          success: true,
          action,
          message:
            hash === "all"
              ? `Successfully ${action === "pause" ? "paused" : "resumed"} all torrents.`
              : `Successfully ${action === "pause" ? "paused" : "resumed"} torrent.`,
        };
      }
    ),
  });
