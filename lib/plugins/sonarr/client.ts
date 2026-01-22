import { ApiClient } from "../core/client";
import type { SonarrQueueItem, SonarrSystemStatus } from "./types";

export class SonarrClient extends ApiClient {
  // Sonarr uses /api/v3 prefix for all endpoints
  protected readonly apiPrefix = "/api/v3";

  async getSystemStatus(): Promise<SonarrSystemStatus> {
    return await this.get<SonarrSystemStatus>("/system/status");
  }

  async getQueue(): Promise<SonarrQueueItem[]> {
    const response = await this.get<{ records: SonarrQueueItem[] }>("/queue");
    return response.records;
  }
}
