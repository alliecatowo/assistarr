import { PluginManager } from "./core/manager";
import type { ServicePlugin } from "./core/types";

// We will import specific services here as we migrate them
import { jellyfinPlugin } from "./jellyfin/definition";
import { jellyseerrPlugin } from "./jellyseerr/definition";
import { qbittorrentPlugin } from "./qbittorrent/definition";
import { radarrPlugin } from "./radarr/definition";
import { sonarrPlugin } from "./sonarr/definition";

const plugins: ServicePlugin[] = [
  radarrPlugin,
  sonarrPlugin,
  jellyseerrPlugin,
  jellyfinPlugin,
  qbittorrentPlugin,
];

export function registerPlugins() {
  const manager = PluginManager.getInstance();

  for (const plugin of plugins) {
    manager.register(plugin);
  }
}

// Initialize registry
registerPlugins();

export const pluginManager = PluginManager.getInstance();
