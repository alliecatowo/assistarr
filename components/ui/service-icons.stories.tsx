import type { Story, StoryDefault } from "@ladle/react";
import type { ServiceIconId } from "@/lib/plugins/registry";
import { ServiceIcon } from "./service-icons";

export default {
  title: "UI / ServiceIcons",
} satisfies StoryDefault;

const allServiceIds: ServiceIconId[] = [
  "radarr",
  "sonarr",
  "jellyfin",
  "jellyseerr",
  "qbittorrent",
  "plex",
  "emby",
  "prowlarr",
  "readarr",
  "lidarr",
  "whisparr",
  "bazarr",
  "generic",
];

// All service icons
export const AllServices: Story = () => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium">All Service Icons</h3>
    <div className="flex flex-wrap gap-6">
      {allServiceIds.map((iconId) => (
        <div key={iconId} className="flex flex-col items-center gap-2">
          <ServiceIcon iconId={iconId} size={32} />
          <span className="text-xs text-muted-foreground capitalize">{iconId}</span>
        </div>
      ))}
    </div>
  </div>
);

// Media managers
export const MediaManagers: Story = () => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium">Media Managers</h3>
    <div className="flex gap-6">
      <div className="flex flex-col items-center gap-2">
        <ServiceIcon iconId="radarr" size={32} />
        <span className="text-xs text-muted-foreground">Movies</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ServiceIcon iconId="sonarr" size={32} />
        <span className="text-xs text-muted-foreground">TV Shows</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ServiceIcon iconId="lidarr" size={32} />
        <span className="text-xs text-muted-foreground">Music</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ServiceIcon iconId="readarr" size={32} />
        <span className="text-xs text-muted-foreground">Books</span>
      </div>
    </div>
  </div>
);

// Media servers
export const MediaServers: Story = () => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium">Media Servers</h3>
    <div className="flex gap-6">
      <div className="flex flex-col items-center gap-2">
        <ServiceIcon iconId="jellyfin" size={32} />
        <span className="text-xs text-muted-foreground">Jellyfin</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ServiceIcon iconId="plex" size={32} />
        <span className="text-xs text-muted-foreground">Plex</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ServiceIcon iconId="emby" size={32} />
        <span className="text-xs text-muted-foreground">Emby</span>
      </div>
    </div>
  </div>
);

// Different sizes
export const Sizes: Story = () => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium">Icon Sizes</h3>
    <div className="flex items-end gap-6">
      <div className="flex flex-col items-center gap-2">
        <ServiceIcon iconId="radarr" size={16} />
        <span className="text-xs text-muted-foreground">16px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ServiceIcon iconId="radarr" size={24} />
        <span className="text-xs text-muted-foreground">24px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ServiceIcon iconId="radarr" size={32} />
        <span className="text-xs text-muted-foreground">32px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ServiceIcon iconId="radarr" size={48} />
        <span className="text-xs text-muted-foreground">48px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <ServiceIcon iconId="radarr" size={64} />
        <span className="text-xs text-muted-foreground">64px</span>
      </div>
    </div>
  </div>
);

// With colors
export const WithColors: Story = () => (
  <div className="space-y-4">
    <h3 className="text-sm font-medium">Colored Icons</h3>
    <div className="flex gap-6">
      <ServiceIcon iconId="radarr" size={32} className="text-yellow-500" />
      <ServiceIcon iconId="sonarr" size={32} className="text-blue-500" />
      <ServiceIcon iconId="jellyfin" size={32} className="text-purple-500" />
      <ServiceIcon iconId="plex" size={32} className="text-orange-500" />
      <ServiceIcon iconId="qbittorrent" size={32} className="text-green-500" />
    </div>
  </div>
);

// Service list example
export const ServiceList: Story = () => (
  <div className="space-y-2 max-w-sm">
    <h3 className="text-sm font-medium mb-4">Connected Services</h3>
    {[
      { id: "radarr" as const, name: "Radarr", status: "connected" },
      { id: "sonarr" as const, name: "Sonarr", status: "connected" },
      { id: "jellyfin" as const, name: "Jellyfin", status: "connected" },
      { id: "qbittorrent" as const, name: "qBittorrent", status: "disconnected" },
    ].map((service) => (
      <div
        key={service.id}
        className="flex items-center gap-3 p-3 rounded-lg border"
      >
        <ServiceIcon iconId={service.id} size={24} />
        <span className="flex-1 text-sm font-medium">{service.name}</span>
        <span
          className={`text-xs px-2 py-1 rounded ${
            service.status === "connected"
              ? "bg-green-500/20 text-green-600"
              : "bg-red-500/20 text-red-600"
          }`}
        >
          {service.status}
        </span>
      </div>
    ))}
  </div>
);
