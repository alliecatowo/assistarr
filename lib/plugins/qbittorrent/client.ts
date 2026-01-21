import { ApiClient } from "../core/client";

export class QBittorrentClient extends ApiClient {
  // biome-ignore lint/suspicious/noExplicitAny: Generic torrent info
  async getTorrents(): Promise<any[]> {
    // biome-ignore lint/suspicious/noExplicitAny: Generic torrent info
    return await this.get<any[]>("/api/v2/torrents/info");
  }

  async getAppVersion(): Promise<string> {
    return await this.get<string>("/api/v2/app/version");
  }

  async postForm(
    path: string,
    // biome-ignore lint/suspicious/noExplicitAny: Flexible payload
    body: FormData | URLSearchParams | Record<string, any>
  ): Promise<void> {
    // If body is a plain object, convert to URLSearchParams because qBittorrent expects form-encoded data or FormData usually
    let requestBody: BodyInit;
    const headers: Record<string, string> = {
      "X-Api-Key": this.config.apiKey,
    };

    if (body instanceof FormData) {
      requestBody = body;
      // fetch handles Content-Type for FormData
    } else if (body instanceof URLSearchParams) {
      requestBody = body;
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    } else {
      // Assume plain object, convert to URLSearchParams for qBit (common pattern)
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(body)) {
        params.append(key, String(value));
      }
      requestBody = params;
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    }

    // Reconstruct URL using config
    const baseUrl = this.config.baseUrl.replace(/\/$/, "");
    const url = `${baseUrl}${path}`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: requestBody,
    });

    if (!response.ok) {
      throw new Error(
        `POST ${path} failed: ${response.status} ${response.statusText}`
      );
    }
  }

  // Helpers methods
  formatBytes(bytes: number, decimals = 2): string {
    return formatBytes(bytes, decimals);
  }

  formatEta(seconds: number): string {
    return formatEta(seconds);
  }

  getStateDescription(state: string): string {
    return getStateDescription(state);
  }
}

// Standalone exports
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) {
    return "0 Bytes";
  }
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

export function formatEta(seconds: number): string {
  if (seconds >= 8_640_000) {
    return "∞";
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
}

export function getStateDescription(state: string): string {
  const states: Record<string, string> = {
    error: "Error",
    missingFiles: "Missing Files",
    uploading: "Seeding",
    pausedUP: "Paused (Seeding)",
    queuedUP: "Queued (Seeding)",
    stalledUP: "Stalled (Seeding)",
    checkingUP: "Checking (Seeding)",
    forcedUP: "Forced Seeding",
    allocating: "Allocating",
    downloading: "Downloading",
    metaDL: "Metadata Download",
    pausedDL: "Paused (DL)",
    queuedDL: "Queued (DL)",
    stalledDL: "Stalled (DL)",
    checkingDL: "Checking (DL)",
    forcedDL: "Forced DL",
    checkingResumeData: "Checking Resume Data",
    moving: "Moving",
    unknown: "Unknown",
  };
  return states[state] || state;
}
