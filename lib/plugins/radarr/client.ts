import { ApiClient } from "../core/client";
import type { RadarrQueueItem, RadarrSystemStatus } from "./types";

export class RadarrClient extends ApiClient {
  // Radarr uses /api/v3 prefix for all endpoints
  protected readonly apiPrefix = "/api/v3";

  async getSystemStatus(): Promise<RadarrSystemStatus> {
    return await this.get<RadarrSystemStatus>("/system/status");
  }

  async getQueue(): Promise<RadarrQueueItem[]> {
    const response = await this.get<{ records: RadarrQueueItem[] }>("/queue");
    return response.records;
  }
}
