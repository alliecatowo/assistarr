import { ApiClient } from "../core/client";
import type { RadarrQueueItem, RadarrSystemStatus } from "./types";

export class RadarrClient extends ApiClient {
  async getSystemStatus(): Promise<RadarrSystemStatus> {
    return await this.get<RadarrSystemStatus>("/api/v3/system/status");
  }

  async getQueue(): Promise<RadarrQueueItem[]> {
    const response = await this.get<{ records: RadarrQueueItem[] }>(
      "/api/v3/queue"
    );
    return response.records;
  }
}
