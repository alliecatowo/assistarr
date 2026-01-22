import { ApiClient } from "../core/client";

export class JellyseerrClient extends ApiClient {
  // Jellyseerr uses /api/v1 prefix for all endpoints
  protected readonly apiPrefix = "/api/v1";

  getStatus() {
    return this.get<{ version: string }>("/status");
  }
}
