import type { Story, StoryDefault } from "@ladle/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

export default {
  title: "Monitor / DownloadQueueWidget",
} satisfies StoryDefault;

// Mock queue item component
const QueueItemRow = ({
  title,
  subtitle,
  status,
  source,
  progress,
  size,
  sizeRemaining,
  timeLeft,
}: {
  title: string;
  subtitle?: string;
  status: string;
  source: string;
  progress: number;
  size: string;
  sizeRemaining: string;
  timeLeft?: string;
}) => {
  const getStatusColor = (status: string) => {
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
  };

  return (
    <div className="space-y-2 py-3 border-b last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate" title={title}>
            {title}
          </p>
          {subtitle && (
            <p
              className="text-xs text-muted-foreground truncate"
              title={subtitle}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge
            className="text-xs capitalize"
            variant={
              getStatusColor(status) as
                | "default"
                | "secondary"
                | "destructive"
                | "outline"
            }
          >
            {status}
          </Badge>
          <Badge className="text-xs" variant="outline">
            {source}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Progress className="flex-1 h-2" value={progress} />
        <span className="text-xs text-muted-foreground w-10 text-right">
          {progress}%
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {sizeRemaining} / {size}
        </span>
        {timeLeft && <span>ETA: {timeLeft}</span>}
      </div>
    </div>
  );
};

// With active downloads
export const WithDownloads: Story = () => (
  <Card className="max-w-xl">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-base font-medium">Download Queue</CardTitle>
      <Badge className="text-xs" variant="secondary">
        3 active
      </Badge>
    </CardHeader>
    <CardContent className="p-0">
      <ScrollArea className="h-[300px] px-6">
        <QueueItemRow
          progress={45}
          size="5.1 GB"
          sizeRemaining="2.3 GB"
          source="Radarr"
          status="downloading"
          timeLeft="23 minutes"
          title="The Matrix (1999)"
        />
        <QueueItemRow
          progress={78}
          size="1.2 GB"
          sizeRemaining="264 MB"
          source="Sonarr"
          status="downloading"
          subtitle="S01E01 - Pilot"
          timeLeft="5 minutes"
          title="Breaking Bad"
        />
        <QueueItemRow
          progress={0}
          size="4.8 GB"
          sizeRemaining="4.8 GB"
          source="Radarr"
          status="queued"
          title="Inception (2010)"
        />
      </ScrollArea>
    </CardContent>
  </Card>
);

// Empty state
export const Empty: Story = () => (
  <Card className="max-w-xl">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-base font-medium">Download Queue</CardTitle>
      <Badge className="text-xs" variant="secondary">
        0 active
      </Badge>
    </CardHeader>
    <CardContent className="p-0">
      <ScrollArea className="h-[300px] px-6">
        <div className="py-8 text-center text-muted-foreground text-sm">
          No active downloads
        </div>
      </ScrollArea>
    </CardContent>
  </Card>
);

// With errors
export const WithErrors: Story = () => (
  <Card className="max-w-xl">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-base font-medium">Download Queue</CardTitle>
      <Badge className="text-xs" variant="secondary">
        2 active
      </Badge>
    </CardHeader>
    <CardContent className="p-0">
      <ScrollArea className="h-[300px] px-6">
        <QueueItemRow
          progress={45}
          size="5.1 GB"
          sizeRemaining="2.3 GB"
          source="Radarr"
          status="downloading"
          timeLeft="23 minutes"
          title="The Matrix (1999)"
        />
        <QueueItemRow
          progress={12}
          size="8.2 GB"
          sizeRemaining="7.2 GB"
          source="Radarr"
          status="failed"
          title="Avatar (2009)"
        />
      </ScrollArea>
    </CardContent>
  </Card>
);

// Completed downloads
export const Completed: Story = () => (
  <Card className="max-w-xl">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-base font-medium">Download Queue</CardTitle>
      <Badge className="text-xs" variant="secondary">
        2 completed
      </Badge>
    </CardHeader>
    <CardContent className="p-0">
      <ScrollArea className="h-[300px] px-6">
        <QueueItemRow
          progress={100}
          size="5.1 GB"
          sizeRemaining="0 B"
          source="Radarr"
          status="completed"
          title="The Matrix (1999)"
        />
        <QueueItemRow
          progress={100}
          size="1.2 GB"
          sizeRemaining="0 B"
          source="Sonarr"
          status="imported"
          subtitle="S01E01 - Pilot"
          title="Breaking Bad"
        />
      </ScrollArea>
    </CardContent>
  </Card>
);

// Single item
export const SingleItem: Story = () => (
  <QueueItemRow
    progress={65}
    size="6.2 GB"
    sizeRemaining="2.2 GB"
    source="Radarr"
    status="downloading"
    timeLeft="15 minutes"
    title="Interstellar (2014)"
  />
);
