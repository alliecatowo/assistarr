import { ApiClient } from "../core/client";
import type { SonarrQueueItem, SonarrSystemStatus } from "./types";

export class SonarrClient extends ApiClient {
  async getSystemStatus(): Promise<SonarrSystemStatus> {
    return await this.get<SonarrSystemStatus>("/api/v3/system/status");
  }

  async getQueue(): Promise<SonarrQueueItem[]> {
    const response = await this.get<{ records: SonarrQueueItem[] }>(
      "/api/v3/queue"
    );
    return response.records;
  }
}
