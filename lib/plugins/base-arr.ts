import { ApiClient } from "./core/client";

export class BaseArrClient<
  SystemStatus,
  QueueItem,
  CalendarItem = unknown,
  Command = unknown,
> extends ApiClient {
  // Common API prefix for Arr services (Radarr/Sonarr)
  protected readonly apiPrefix = "/api/v3";

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<SystemStatus> {
    return await this.get<SystemStatus>("/system/status");
  }

  /**
   * Get current activity queue
   */
  async getQueue(): Promise<QueueItem[]> {
    // Queue endpoint returns a paginated response wrapper
    const response = await this.get<{ records: QueueItem[] }>("/queue");
    return response.records;
  }

  /**
   * Get calendar items (movies/episodes)
   */
  async getCalendar(start?: Date, end?: Date): Promise<CalendarItem[]> {
    const params: Record<string, string> = {};
    if (start) {
      params.start = start.toISOString();
    }
    if (end) {
      params.end = end.toISOString();
    }
    return await this.get<CalendarItem[]>("/calendar", params);
  }

  /**
   * Get status of recent commands
   */
  async getCommandStatus(): Promise<Command[]> {
    return await this.get<Command[]>("/command");
  }
}
