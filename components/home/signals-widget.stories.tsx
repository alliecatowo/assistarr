import type { Story, StoryDefault } from "@ladle/react";
import type { MonitorStatus } from "@/app/(monitor)/api/status/route";

export default {
  title: "Home / SignalsWidget",
} satisfies StoryDefault;

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

function ServicePill({
  label,
  online,
  configured,
  error,
}: {
  label: string;
  online: boolean;
  configured: boolean;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-muted/50 p-3 text-sm shadow-sm">
      <div className="flex items-center justify-between">
        <span className="capitalize">{label}</span>
        <span
          className={`flex h-2.5 w-2.5 rounded-full ${
            configured
              ? online
                ? "bg-emerald-500"
                : "bg-amber-500"
              : "bg-muted-foreground/50"
          }`}
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        {error
          ? error
          : configured
            ? online
              ? "Online"
              : "Offline"
            : "Not configured"}
      </p>
    </div>
  );
}

function PipelineStatus({
  queueItems,
}: {
  queueItems: Array<{ id: string; progress: number }>;
}) {
  return (
    <div className="mt-4 space-y-2 rounded-xl border bg-muted/60 p-3">
      <div className="flex items-center justify-between text-sm font-medium">
        <span>Live pipelines</span>
        <span className="inline-flex h-5 items-center rounded-full border bg-secondary px-2 text-[10px] font-semibold">
          {queueItems.length} in flight
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="absolute h-full bg-primary transition-all"
          style={{ width: `${Math.min(100, queueItems[0]?.progress ?? 12)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Tracking downloads, requests, and transcodes across providers.
      </p>
    </div>
  );
}

function SignalsWidgetContent({
  status,
  queueItems,
}: {
  status: MonitorStatus;
  queueItems: Array<{ id: string; progress: number }>;
}) {
  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {Object.entries(status.services).map(([key, service]) => (
          <ServicePill
            configured={service.configured}
            error={service.error}
            key={key}
            label={key}
            online={service.online}
          />
        ))}
      </div>
      <PipelineStatus queueItems={queueItems} />
    </>
  );
}

function MutedBlock({ message }: { message: string }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed bg-muted/40 px-4 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

const SignalsWidget = ({
  status,
  queueItems = [],
}: {
  status: MonitorStatus | null;
  queueItems?: Array<{ id: string; progress: number }>;
}) => {
  return (
    <div className="col-span-1 rounded-2xl border bg-card p-5 shadow-sm sm:col-span-6 xl:col-span-4">
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
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold">Signals & Status</p>
            <p className="text-xs text-muted-foreground">
              Fluid, AI-reshuffled blocks
            </p>
          </div>
        </div>
        <ActionButton>
          Open monitor
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
      {status ? (
        <SignalsWidgetContent queueItems={queueItems} status={status} />
      ) : (
        <MutedBlock message="Connect services to light up signals" />
      )}
    </div>
  );
};

const mockStatusAllOnline: MonitorStatus = {
  services: {
    radarr: { configured: true, enabled: true, online: true },
    sonarr: { configured: true, enabled: true, online: true },
    jellyseerr: { configured: true, enabled: true, online: true },
    jellyfin: { configured: true, enabled: true, online: true },
    qbittorrent: { configured: true, enabled: true, online: true },
  },
  queues: { radarr: [], sonarr: [] },
  torrents: [],
  requests: { pending: [] },
  errors: { failed: [], stalled: [] },
  stats: { activeStreams: 3, pendingRequests: 2, totalDownloads: 156 },
};

const mockStatusWithErrors: MonitorStatus = {
  services: {
    radarr: {
      configured: true,
      enabled: true,
      online: false,
      error: "Connection timeout",
    },
    sonarr: { configured: true, enabled: true, online: true },
    jellyseerr: { configured: true, enabled: true, online: true },
    jellyfin: { configured: true, enabled: true, online: true },
    qbittorrent: { configured: false, enabled: false, online: false },
  },
  queues: { radarr: [], sonarr: [] },
  torrents: [],
  requests: { pending: [] },
  errors: { failed: [], stalled: [] },
  stats: { activeStreams: 3, pendingRequests: 2, totalDownloads: 156 },
};

const mockQueueItems = [
  { id: "1", progress: 45 },
  { id: "2", progress: 78 },
  { id: "3", progress: 12 },
];

export const AllServicesOnline: Story = () => (
  <SignalsWidget queueItems={mockQueueItems} status={mockStatusAllOnline} />
);

export const WithServiceErrors: Story = () => (
  <SignalsWidget queueItems={mockQueueItems} status={mockStatusWithErrors} />
);

export const NoServicesConfigured: Story = () => (
  <SignalsWidget status={null} />
);

export const ManyPipelines: Story = () => (
  <SignalsWidget
    queueItems={[
      { id: "1", progress: 45 },
      { id: "2", progress: 78 },
      { id: "3", progress: 12 },
      { id: "4", progress: 92 },
      { id: "5", progress: 33 },
      { id: "6", progress: 67 },
    ]}
    status={mockStatusAllOnline}
  />
);

export const NoActivePipelines: Story = () => (
  <SignalsWidget queueItems={[]} status={mockStatusAllOnline} />
);
