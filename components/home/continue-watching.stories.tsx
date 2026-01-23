import type { Story, StoryDefault } from "@ladle/react";

export default {
  title: "Home / ContinueWatchingWidget",
} satisfies StoryDefault;

interface ContinueWatchingItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  progress: number;
  remaining?: string;
  lastWatched?: string | null;
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

function ContinueCard({ item }: { item: ContinueWatchingItem }) {
  return (
    <div className="group relative flex w-[240px] shrink-0 flex-col overflow-hidden rounded-2xl border bg-muted/40 shadow-sm">
      <div className="relative h-36 w-full overflow-hidden">
        {item.imageUrl ? (
          // biome-ignore lint/performance/noImgElement: stories don't need optimized images
          <img
            alt={item.title}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            src={item.imageUrl}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <svg
              className="h-5 w-5 text-muted-foreground"
              fill="none"
              height="24"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="24"
            >
              <rect height="18" rx="2" width="18" x="3" y="3" />
              <line x1="9" x2="9" y1="3" y2="21" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-2 left-2 flex items-center gap-2 text-[11px] font-medium text-white">
          {item.badge && (
            <span className="rounded-full bg-white/20 px-2 py-0.5">
              {item.badge}
            </span>
          )}
          {item.remaining && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 backdrop-blur">
              {item.remaining}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1.5 p-3">
        <p className="text-sm font-semibold leading-tight line-clamp-2">
          {item.title}
        </p>
        {item.subtitle && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {item.subtitle}
          </p>
        )}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="absolute h-full bg-primary transition-all"
            style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
          />
        </div>
        {item.lastWatched && (
          <p className="text-[11px] text-muted-foreground">
            Last watched: {new Date(item.lastWatched).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}

const ContinueWatchingWidget = ({
  continueWatching,
}: {
  continueWatching: ContinueWatchingItem[];
}) => {
  return (
    <div className="col-span-1 row-span-2 rounded-2xl border bg-card p-5 shadow-sm sm:col-span-6 xl:col-span-7">
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
              <path d="M2.5 2v6h6M2.66 12a9 9 0 1 0 1.49-4.66" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold">Continue watching</p>
            <p className="text-xs text-muted-foreground">
              Fluid, AI-reshuffled blocks
            </p>
          </div>
        </div>
        <ActionButton>
          Jump to player
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
      <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
        {continueWatching.length > 0 ? (
          continueWatching.map((item) => (
            <ContinueCard item={item} key={item.id} />
          ))
        ) : (
          <MutedBlock message="No in-progress sessions. Press play or connect Jellyfin to populate this lane." />
        )}
      </div>
    </div>
  );
};

const mockContinueWatching: ContinueWatchingItem[] = [
  {
    id: "1",
    title: "Dune: Part Two",
    subtitle: "S01E03",
    progress: 67,
    remaining: "45 min left",
    lastWatched: "2024-01-20",
    badge: "Movie",
    imageUrl: "https://via.placeholder.com/240x360",
  },
  {
    id: "2",
    title: "House of the Dragon",
    subtitle: "S02E05",
    progress: 23,
    remaining: "52 min left",
    lastWatched: "2024-01-19",
    badge: "TV",
    imageUrl: "https://via.placeholder.com/240x360",
  },
  {
    id: "3",
    title: "Breaking Bad",
    subtitle: "S03E07",
    progress: 89,
    remaining: "6 min left",
    lastWatched: "2024-01-18",
    badge: "TV",
    imageUrl: "https://via.placeholder.com/240x360",
  },
  {
    id: "4",
    title: "Oppenheimer",
    progress: 45,
    remaining: "2h 30m left",
    lastWatched: "2024-01-15",
    badge: "Movie",
    imageUrl: "https://via.placeholder.com/240x360",
  },
  {
    id: "5",
    title: "The Last of Us",
    subtitle: "S01E04",
    progress: 12,
    remaining: "48 min left",
    lastWatched: "2024-01-10",
    badge: "TV",
    imageUrl: "https://via.placeholder.com/240x360",
  },
];

export const Default: Story = () => (
  <ContinueWatchingWidget continueWatching={mockContinueWatching} />
);

export const FewItems: Story = () => (
  <ContinueWatchingWidget
    continueWatching={[
      {
        id: "1",
        title: "Dune: Part Two",
        progress: 67,
        remaining: "45 min left",
        lastWatched: "2024-01-20",
        badge: "Movie",
        imageUrl: "https://via.placeholder.com/240x360",
      },
      {
        id: "2",
        title: "House of the Dragon",
        subtitle: "S02E05",
        progress: 23,
        remaining: "52 min left",
        lastWatched: "2024-01-19",
        badge: "TV",
        imageUrl: "https://via.placeholder.com/240x360",
      },
    ]}
  />
);

export const Empty: Story = () => (
  <ContinueWatchingWidget continueWatching={[]} />
);

export const NearCompletion: Story = () => (
  <ContinueWatchingWidget
    continueWatching={[
      {
        id: "1",
        title: "Breaking Bad",
        subtitle: "S03E07",
        progress: 89,
        remaining: "6 min left",
        lastWatched: "2024-01-18",
        badge: "TV",
        imageUrl: "https://via.placeholder.com/240x360",
      },
      {
        id: "2",
        title: "Oppenheimer",
        progress: 92,
        remaining: "15 min left",
        lastWatched: "2024-01-20",
        badge: "Movie",
        imageUrl: "https://via.placeholder.com/240x360",
      },
      {
        id: "3",
        title: "Inception",
        progress: 78,
        remaining: "45 min left",
        lastWatched: "2024-01-19",
        badge: "Movie",
        imageUrl: "https://via.placeholder.com/240x360",
      },
    ]}
  />
);

export const JustStarted: Story = () => (
  <ContinueWatchingWidget
    continueWatching={[
      {
        id: "1",
        title: "House of the Dragon",
        subtitle: "S02E05",
        progress: 5,
        remaining: "58 min left",
        lastWatched: "2024-01-20",
        badge: "TV",
        imageUrl: "https://via.placeholder.com/240x360",
      },
      {
        id: "2",
        title: "Dune: Part Two",
        progress: 2,
        remaining: "2h 55m left",
        lastWatched: "2024-01-20",
        badge: "Movie",
        imageUrl: "https://via.placeholder.com/240x360",
      },
    ]}
  />
);

export const NoImages: Story = () => (
  <ContinueWatchingWidget
    continueWatching={[
      {
        id: "1",
        title: "Breaking Bad",
        subtitle: "S03E07",
        progress: 89,
        remaining: "6 min left",
        lastWatched: "2024-01-18",
        badge: "TV",
        imageUrl: null,
      },
      {
        id: "2",
        title: "Dune: Part Two",
        progress: 45,
        remaining: "1h 30m left",
        lastWatched: "2024-01-19",
        badge: "Movie",
        imageUrl: null,
      },
    ]}
  />
);
