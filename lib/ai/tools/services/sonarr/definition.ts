import type { ServiceDefinition } from "../base";
import { addSeries } from "./add-series";
import { getCalendar } from "./get-calendar";
import { getQueue } from "./get-queue";
import { searchSeries } from "./search-series";

/**
 * Sonarr service definition for the plugin system.
 * Sonarr is a TV series collection manager that can monitor and download episodes.
 */
export const sonarrService: ServiceDefinition = {
  name: "sonarr",
  displayName: "Sonarr",
  description:
    "TV series collection manager for monitoring, downloading, and organizing TV shows. Automatically downloads new episodes as they air.",
  tools: {
    searchSeries,
    addSeries,
    getSonarrQueue: getQueue,
    getSonarrCalendar: getCalendar,
  },
  healthCheck: async ({ config }) => {
    try {
      const response = await fetch(`${config.baseUrl}/api/v3/system/status`, {
        headers: {
          "X-Api-Key": config.apiKey,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
