import { createLogger } from "@/lib/logger";
import {
  ApiClient,
  DEFAULT_TIMEOUT_MS,
  type RequestOptions,
} from "../core/client";

const log = createLogger("qbittorrent-client");

export class QBittorrentClient extends ApiClient {
  private cookie: string | null = null;

  private async authenticate(): Promise<void> {
    const baseUrl = this.config.baseUrl.replace(/\/$/, "");
    const url = `${baseUrl}/api/v2/auth/login`;

    const body = new URLSearchParams({
      username: this.config.username ?? "",
      password: this.config.password ?? "",
    });

    const timeoutMs = DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body,
        signal: controller.signal,
      });

      const text = await response.text();

      if (text !== "Ok.") {
        throw new Error(`Authentication failed: ${text}`);
      }

      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        this.cookie = setCookie.split(";")[0];
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async getCookie(): Promise<string | null> {
    if (!this.cookie && this.config.username && this.config.password) {
      await this.authenticate();
    }
    return this.cookie;
  }

  protected override getHeaders(): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    return this.getCookie().then((cookie) => {
      if (cookie) {
        headers.Cookie = cookie;
      }
      return headers;
    });
  }

  async getAppVersion(): Promise<string> {
    const baseUrl = this.config.baseUrl.replace(/\/$/, "");
    const url = `${baseUrl}/api/v2/app/version`;

    const cookie = await this.getCookie();

    const timeoutMs = DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `GET /api/v2/app/version failed: ${response.status} ${response.statusText}`
        );
      }

      return await response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: Generic torrent info
  async getTorrents(): Promise<any[]> {
    const baseUrl = this.config.baseUrl.replace(/\/$/, "");
    const url = `${baseUrl}/api/v2/torrents/info`;

    const cookie = await this.getCookie();

    const timeoutMs = DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(
          `GET /api/v2/torrents/info failed: ${response.status} ${response.statusText}`
        );
      }

      const text = await response.text();
      if (!text) {
        return [];
      }
      return JSON.parse(text);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async postForm(
    path: string,
    // biome-ignore lint/suspicious/noExplicitAny: Flexible payload
    body: FormData | URLSearchParams | Record<string, any>,
    options?: RequestOptions
  ): Promise<void> {
    let requestBody: BodyInit;

    if (body instanceof FormData) {
      requestBody = body;
    } else if (body instanceof URLSearchParams) {
      requestBody = body;
    } else {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(body)) {
        params.append(key, String(value));
      }
      requestBody = params;
    }

    const baseUrl = this.config.baseUrl.replace(/\/$/, "");
    const url = `${baseUrl}${path}`;

    const timeoutMs = options?.timeout ?? DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const cookie = await this.getCookie();

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: requestBody,
        signal: controller.signal,
      });

      if (!response.ok) {
        log.warn(
          { url, status: response.status, statusText: response.statusText },
          `POST ${path} failed`
        );
        throw new Error(
          `POST ${path} failed: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        log.error({ url, timeoutMs }, `POST ${path} timed out`);
        throw new Error(`POST ${path} timed out after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

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
