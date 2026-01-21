import { tool } from "ai";
import { z } from "zod";
import type { ToolFactoryProps } from "../core/types";
import { formatBytes, QBittorrentClient } from "./client";
import type { SyncMainData, TransferInfo } from "./types";

export const getTransferInfo = ({
  session: _session,
  config,
}: ToolFactoryProps) => {
  const client = new QBittorrentClient(config);

  return tool({
    description:
      "Get global transfer statistics from qBittorrent including current download/upload speeds, total data transferred, and free disk space.",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const [transferInfo, mainData] = await Promise.all([
          client.get<TransferInfo>("/transfer/info"),
          client.get<SyncMainData>("/sync/maindata"),
        ]);

        const serverState = mainData.server_state;

        const torrents = Object.values(mainData.torrents);
        const downloadingCount = torrents.filter(
          (t) =>
            t.state &&
            ["downloading", "metaDL", "stalledDL", "forcedDL"].includes(t.state)
        ).length;
        const seedingCount = torrents.filter(
          (t) =>
            t.state && ["uploading", "stalledUP", "forcedUP"].includes(t.state)
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
        return {
          message: `Error getting transfer info: ${error instanceof Error ? error.message : "Unknown error"}`,
          speeds: {
            download: "0 B/s",
            upload: "0 B/s",
            downloadRaw: 0,
            uploadRaw: 0,
          },
        };
      }
    },
  });
};
