"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { QueueItem, TorrentItem } from "@/app/(monitor)/api/status/route";

interface DownloadQueueWidgetProps {
  radarrQueue: QueueItem[];
  sonarrQueue: QueueItem[];
  torrents: TorrentItem[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

function getStatusColor(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toLowerCase()) {
    case "downloading":
      return "default";
    case "completed":
    case "imported":
      return "secondary";
    case "failed":
    case "warning":
    case "error":
      return "destructive";
    default:
      return "outline";
  }
}

function QueueItemRow({ item }: { item: QueueItem }) {
  return (
    <div className="space-y-2 py-3 border-b last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate" title={item.title}>
            {item.title}
          </p>
          {item.subtitle && (
            <p className="text-xs text-muted-foreground truncate" title={item.subtitle}>
              {item.subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={getStatusColor(item.status)} className="text-xs capitalize">
            {item.status}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {item.source}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={item.progress} className="flex-1 h-2" />
        <span className="text-xs text-muted-foreground w-10 text-right">
          {item.progress}%
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {formatBytes(item.size - item.sizeRemaining)} / {formatBytes(item.size)}
        </span>
        {item.timeLeft && <span>ETA: {item.timeLeft}</span>}
      </div>
    </div>
  );
}

function TorrentItemRow({ torrent }: { torrent: TorrentItem }) {
  return (
    <div className="space-y-2 py-3 border-b last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate" title={torrent.name}>
            {torrent.name}
          </p>
        </div>
        <Badge variant={getStatusColor(torrent.state)} className="text-xs capitalize shrink-0">
          {torrent.state.replace(/([A-Z])/g, " $1").trim()}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={torrent.progress} className="flex-1 h-2" />
        <span className="text-xs text-muted-foreground w-10 text-right">
          {torrent.progress}%
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatBytes(torrent.size)}</span>
        <span>
          {formatSpeed(torrent.dlspeed)} down / {formatSpeed(torrent.upspeed)} up
        </span>
      </div>
    </div>
  );
}

export function DownloadQueueWidget({
  radarrQueue,
  sonarrQueue,
  torrents,
}: DownloadQueueWidgetProps) {
  const allQueueItems = [...radarrQueue, ...sonarrQueue];
  const activeDownloads = allQueueItems.filter(
    (item) => item.status === "downloading" || item.status === "queued"
  );
  const activeTorrents = torrents.filter(
    (t) => t.state === "downloading" || t.state === "forcedDL" || t.state === "metaDL"
  );

  const totalItems = activeDownloads.length + activeTorrents.length;

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Download Queue</CardTitle>
        <Badge variant="secondary" className="text-xs">
          {totalItems} active
        </Badge>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-6">
          {totalItems === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No active downloads
            </div>
          ) : (
            <>
              {activeDownloads.map((item) => (
                <QueueItemRow key={`${item.source}-${item.id}`} item={item} />
              ))}
              {activeTorrents.map((torrent) => (
                <TorrentItemRow key={torrent.hash} torrent={torrent} />
              ))}
            </>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
