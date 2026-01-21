import { ApiClient } from "../core/client";

export class RadarrClient extends ApiClient {
  // Add Radarr-specific methods if needed, or just use generic get/post/put/delete

  // Example of a specific method if we wanted it here, but mostly tools will call generic methods
  getSystemStatus() {
    return this.get("/api/v3/system/status");
  }
}
