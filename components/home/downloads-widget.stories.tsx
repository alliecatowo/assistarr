import type { Story, StoryDefault } from "@ladle/react";

export default {
  title: "Home / DownloadsWidget",
} satisfies StoryDefault;

interface QueueItem {
  id: string;
  title: string;
  subtitle?: string;
  progress: number;
  badge?: string;
}

function ActionButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      className="h-8 rounded-full px-3 text-xs shadow-sm hover:bg-accent inline-flex items-center justify-center border bg-background"
      type="button"
    >
      {children}
    </button>
  );
}

function MutedBlock({ message }: { message: string }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed bg-muted/40 px-4 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function QueueRow({ item }: { item: QueueItem }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-inner">
        <svg
          className="h-4 w-4 text-primary"
          fill="none"
          height="24"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="24"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium line-clamp-1">{item.title}</p>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="line-clamp-1">
            {item.subtitle || "Queued source"}
          </span>
          {item.badge && (
            <span className="rounded-full bg-background px-2 py-0.5 text-[10px]">
              {item.badge}
            </span>
          )}
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="absolute h-full bg-primary transition-all"
            style={{ width: `${Math.min(100, item.progress)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

const DownloadsWidget = ({ queueItems }: { queueItems: QueueItem[] }) => {
  return (
    <div className="col-span-1 rounded-2xl border bg-card p-5 shadow-sm sm:col-span-6 xl:col-span-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <svg
              className="h-4 w-4"
              fill="none"
              height="24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold">Pipelines & queue</p>
            <p className="text-xs text-muted-foreground">
              Fluid, AI-reshuffled blocks
            </p>
          </div>
        </div>
        <ActionButton>
          Inspect
          <svg
            className="ml-1 h-3.5 w-3.5"
            fill="none"
            height="24"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="24"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" x2="21" y1="14" y2="3" />
          </svg>
        </ActionButton>
      </div>
      <div className="mt-4 space-y-3">
        {queueItems.length ? (
          queueItems.map((item) => <QueueRow item={item} key={item.id} />)
        ) : (
          <MutedBlock message="Nothing queued. When Radarr, Sonarr or torrents spin up, you&apos;ll see them pulse here." />
        )}
      </div>
    </div>
  );
};

const mockQueueItems: QueueItem[] = [
  { id: "radarr-1", title: "The Matrix (1999)", progress: 45, badge: "Radarr" },
  {
    id: "sonarr-1",
    title: "Breaking Bad",
    subtitle: "S01E01 - Pilot",
    progress: 78,
    badge: "Sonarr",
  },
  { id: "radarr-2", title: "Inception (2010)", progress: 12, badge: "Radarr" },
  {
    id: "torrent-1",
    title: "Avatar.torrent",
    subtitle: "Downloading",
    progress: 62,
    badge: "qBittorrent",
  },
  {
    id: "sonarr-2",
    title: "House of the Dragon",
    subtitle: "S02E03",
    progress: 0,
    badge: "Sonarr",
  },
  {
    id: "radarr-3",
    title: "Interstellar (2014)",
    progress: 95,
    badge: "Radarr",
  },
];

export const Default: Story = () => (
  <DownloadsWidget queueItems={mockQueueItems} />
);

export const Empty: Story = () => <DownloadsWidget queueItems={[]} />;

export const SingleItem: Story = () => (
  <DownloadsWidget
    queueItems={[
      {
        id: "radarr-1",
        title: "The Matrix (1999)",
        progress: 45,
        badge: "Radarr",
      },
    ]}
  />
);

export const Downloading: Story = () => (
  <DownloadsWidget
    queueItems={[
      {
        id: "radarr-1",
        title: "The Matrix (1999)",
        progress: 45,
        badge: "Radarr",
      },
      {
        id: "sonarr-1",
        title: "Breaking Bad",
        subtitle: "S01E01",
        progress: 78,
        badge: "Sonarr",
      },
      {
        id: "torrent-1",
        title: "Avatar.torrent",
        subtitle: "Downloading",
        progress: 62,
        badge: "qBittorrent",
      },
    ]}
  />
);

export const NearlyComplete: Story = () => (
  <DownloadsWidget
    queueItems={[
      {
        id: "radarr-1",
        title: "The Matrix (1999)",
        progress: 95,
        badge: "Radarr",
      },
      {
        id: "sonarr-1",
        title: "Breaking Bad",
        subtitle: "S01E01",
        progress: 88,
        badge: "Sonarr",
      },
      {
        id: "radarr-2",
        title: "Inception (2010)",
        progress: 72,
        badge: "Radarr",
      },
    ]}
  />
);

export const MixedSources: Story = () => (
  <DownloadsWidget
    queueItems={[
      {
        id: "radarr-1",
        title: "Dune: Part Two",
        progress: 45,
        badge: "Radarr",
      },
      { id: "radarr-2", title: "Oppenheimer", progress: 0, badge: "Radarr" },
      {
        id: "sonarr-1",
        title: "House of the Dragon",
        subtitle: "S02E05",
        progress: 78,
        badge: "Sonarr",
      },
      {
        id: "sonarr-2",
        title: "The Last of Us",
        subtitle: "S01E03",
        progress: 0,
        badge: "Sonarr",
      },
      {
        id: "torrent-1",
        title: "Avatar.torrent",
        subtitle: "Downloading",
        progress: 62,
        badge: "qBittorrent",
      },
      {
        id: "torrent-2",
        title: "Endgame.torrent",
        subtitle: "Downloading",
        progress: 28,
        badge: "qBittorrent",
      },
    ]}
  />
);

export const QueuedOnly: Story = () => (
  <DownloadsWidget
    queueItems={[
      {
        id: "radarr-1",
        title: "The Matrix (1999)",
        progress: 0,
        badge: "Radarr",
      },
      {
        id: "sonarr-1",
        title: "Breaking Bad",
        subtitle: "S01E01",
        progress: 0,
        badge: "Sonarr",
      },
      {
        id: "torrent-1",
        title: "Avatar.torrent",
        subtitle: "Queued",
        progress: 0,
        badge: "qBittorrent",
      },
    ]}
  />
);
