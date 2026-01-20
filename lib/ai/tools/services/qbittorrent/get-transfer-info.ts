import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import {
  formatBytes,
  QBittorrentClientError,
  qbittorrentRequest,
} from "./client";
import type { SyncMainData, TransferInfo } from "./types";

interface GetTransferInfoProps {
  session: Session;
}

export const getTransferInfo = ({ session }: GetTransferInfoProps) =>
  tool({
    description:
      "Get global transfer statistics from qBittorrent including current download/upload speeds, total data transferred, and free disk space.",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        // Get transfer info and main data (for disk space) in parallel
        const [transferInfo, mainData] = await Promise.all([
          qbittorrentRequest<TransferInfo>(session.user.id, "/transfer/info"),
          qbittorrentRequest<SyncMainData>(session.user.id, "/sync/maindata"),
        ]);

        const serverState = mainData.server_state;

        // Count active torrents
        const torrents = Object.values(mainData.torrents);
        const downloadingCount = torrents.filter((t) =>
          ["downloading", "metaDL", "stalledDL", "forcedDL"].includes(
            t.state as string
          )
        ).length;
        const seedingCount = torrents.filter((t) =>
          ["uploading", "stalledUP", "forcedUP"].includes(t.state as string)
        ).length;

        return {
          speeds: {
            download: `${formatBytes(transferInfo.dl_info_speed)}/s`,
            upload: `${formatBytes(transferInfo.up_info_speed)}/s`,
            downloadRaw: transferInfo.dl_info_speed,
            uploadRaw: transferInfo.up_info_speed,
          },
          limits: {
            download:
              transferInfo.dl_rate_limit > 0
                ? `${formatBytes(transferInfo.dl_rate_limit)}/s`
                : "Unlimited",
            upload:
              transferInfo.up_rate_limit > 0
                ? `${formatBytes(transferInfo.up_rate_limit)}/s`
                : "Unlimited",
          },
          session: {
            downloaded: formatBytes(transferInfo.dl_info_data),
            uploaded: formatBytes(transferInfo.up_info_data),
          },
          allTime: {
            downloaded: formatBytes(serverState.alltime_dl),
            uploaded: formatBytes(serverState.alltime_ul),
            ratio: serverState.global_ratio,
          },
          disk: {
            freeSpace: formatBytes(serverState.free_space_on_disk),
            freeSpaceBytes: serverState.free_space_on_disk,
          },
          connection: {
            status: serverState.connection_status,
            dhtNodes: transferInfo.dht_nodes,
            totalPeers: serverState.total_peer_connections,
          },
          alternativeSpeedLimits: serverState.use_alt_speed_limits,
          activeTorrents: {
            downloading: downloadingCount,
            seeding: seedingCount,
            total: torrents.length,
          },
          message: `Download: ${formatBytes(transferInfo.dl_info_speed)}/s | Upload: ${formatBytes(transferInfo.up_info_speed)}/s | Free disk space: ${formatBytes(serverState.free_space_on_disk)}`,
        };
      } catch (error) {
        if (error instanceof QBittorrentClientError) {
          return { error: error.message };
        }
        return {
          error:
            "Failed to get transfer info from qBittorrent. Please try again.",
        };
      }
    },
  });
