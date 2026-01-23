import type { Story, StoryDefault } from "@ladle/react";
import { GaugeIcon, LibraryIcon, SparklesIcon, WavesIcon } from "lucide-react";

export default {
  title: "Home / HeroSection",
} satisfies StoryDefault;

function HeroStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border bg-background/80 p-3 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function HeroButtons() {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        type="button"
      >
        Start a chat
      </button>
      <button
        className="inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium shadow-sm hover:bg-secondary/80"
        type="button"
      >
        Discover
      </button>
      <button
        className="inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        type="button"
      >
        Monitor
      </button>
    </div>
  );
}

export const Default: Story = () => (
  <div className="max-w-4xl">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-6 xl:grid-cols-12">
      <div className="relative col-span-1 row-span-2 overflow-hidden rounded-3xl border bg-gradient-to-br from-background via-muted/60 to-background p-6 shadow-sm sm:col-span-6 xl:col-span-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(251,191,36,0.16),transparent_30%)]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            <SparklesIcon className="h-4 w-4 text-primary" />
            Home
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Hey Alex, here is your media universe—alive, synced, and
                remixable.
              </p>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Everything now in one adaptive canvas.
              </h1>
            </div>
            <HeroButtons />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HeroStat
              hint="Radarr, Sonarr, Jellyfin, Jellyseerr, qBittorrent"
              icon={GaugeIcon}
              label="Services online"
              value="4/5"
            />
            <HeroStat
              hint="78 films · 50 series"
              icon={LibraryIcon}
              label="Library footprint"
              value="128 items"
            />
            <HeroStat
              hint="Across Radarr, Sonarr, torrents"
              icon={WavesIcon}
              label="Active downloads"
              value="8"
            />
            <HeroStat
              hint="Personalized recs ready"
              icon={SparklesIcon}
              label="AI signals"
              value={3}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const Anonymous: Story = () => (
  <div className="max-w-4xl">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-6 xl:grid-cols-12">
      <div className="relative col-span-1 row-span-2 overflow-hidden rounded-3xl border bg-gradient-to-br from-background via-muted/60 to-background p-6 shadow-sm sm:col-span-6 xl:col-span-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(251,191,36,0.16),transparent_30%)]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            <SparklesIcon className="h-4 w-4 text-primary" />
            Home
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Welcome, here is your media universe—alive, synced, and
                remixable.
              </p>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Everything now in one adaptive canvas.
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HeroStat
              hint="Connect services to track status"
              icon={GaugeIcon}
              label="Services online"
              value="—"
            />
            <HeroStat
              hint="Add Radarr/Sonarr for richer stats"
              icon={LibraryIcon}
              label="Library footprint"
              value="Configure services"
            />
            <HeroStat
              hint="No active downloads"
              icon={WavesIcon}
              label="Active downloads"
              value={0}
            />
            <HeroStat
              hint="Sign in to unlock AI recommendations"
              icon={SparklesIcon}
              label="AI signals"
              value={0}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const NoDownloads: Story = () => (
  <div className="max-w-4xl">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-6 xl:grid-cols-12">
      <div className="relative col-span-1 row-span-2 overflow-hidden rounded-3xl border bg-gradient-to-br from-background via-muted/60 to-background p-6 shadow-sm sm:col-span-6 xl:col-span-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(251,191,36,0.16),transparent_30%)]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            <SparklesIcon className="h-4 w-4 text-primary" />
            Home
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Hey Alex, here is your media universe—alive, synced, and
                remixable.
              </p>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Everything now in one adaptive canvas.
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HeroStat
              hint="Radarr, Sonarr, Jellyfin, Jellyseerr, qBittorrent"
              icon={GaugeIcon}
              label="Services online"
              value="4/5"
            />
            <HeroStat
              hint="78 films · 50 series"
              icon={LibraryIcon}
              label="Library footprint"
              value="128 items"
            />
            <HeroStat
              hint="Nothing downloading right now"
              icon={WavesIcon}
              label="Active downloads"
              value={0}
            />
            <HeroStat
              hint="Personalized recs ready"
              icon={SparklesIcon}
              label="AI signals"
              value={3}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const HeavyActivity: Story = () => (
  <div className="max-w-4xl">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-6 xl:grid-cols-12">
      <div className="relative col-span-1 row-span-2 overflow-hidden rounded-3xl border bg-gradient-to-br from-background via-muted/60 to-background p-6 shadow-sm sm:col-span-6 xl:col-span-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(251,191,36,0.16),transparent_30%)]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            <SparklesIcon className="h-4 w-4 text-primary" />
            Home
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Hey Alex, here is your media universe—alive, synced, and
                remixable.
              </p>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Everything now in one adaptive canvas.
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <HeroStat
              hint="All systems operational"
              icon={GaugeIcon}
              label="Services online"
              value="5/5"
            />
            <HeroStat
              hint="312 films · 230 series"
              icon={LibraryIcon}
              label="Library footprint"
              value="542 items"
            />
            <HeroStat
              hint="12 downloading · 12 queued"
              icon={WavesIcon}
              label="Active downloads"
              value={24}
            />
            <HeroStat
              hint="New picks available"
              icon={SparklesIcon}
              label="AI signals"
              value={12}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);
