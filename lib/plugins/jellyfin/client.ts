import { ApiClient } from "../core/client";

export class JellyfinClient extends ApiClient {
  // biome-ignore lint/suspicious/noExplicitAny: Generic system info
  async getSystemInfo(): Promise<any> {
    // biome-ignore lint/suspicious/noExplicitAny: Generic system info
    return await this.get<any>("/System/Info/Public");
  }

  protected getHeaders(): Promise<HeadersInit> {
    return Promise.resolve({
      "X-Emby-Token": this.config.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    });
  }

  // Helper for health check
  async getStatus(): Promise<boolean> {
    try {
      await this.getSystemInfo();
      return true;
    } catch {
      return false;
    }
  }

  // Helpers methods (optional if we prefer standalone functions exclusively)
  getImageUrl(
    itemId: string,
    options: { type?: string; maxWidth?: number } = {}
  ): string {
    return getImageUrl(
      this.config.baseUrl,
      itemId,
      options.type,
      options.maxWidth
    );
  }

  formatDuration(ticks: number): string {
    return formatDuration(ticks);
  }

  calculateProgressPercentage(
    positionTicks: number,
    runTimeTicks: number
  ): number {
    return calculateProgressPercentage(positionTicks, runTimeTicks);
  }

  ticksToMinutes(ticks: number): number {
    return ticksToMinutes(ticks);
  }
}

// Standalone exports for tools
export function getImageUrl(
  baseUrl: string,
  itemId: string,
  type = "Primary",
  maxWidth?: number,
  apiKey?: string
): string {
  const params = new URLSearchParams({
    quality: "90",
  });

  if (maxWidth) {
    params.set("maxWidth", maxWidth.toString());
  }

  if (apiKey) {
    params.set("api_key", apiKey);
  }

  return `${baseUrl}/Items/${itemId}/Images/${type}?${params.toString()}`;
}

export function formatDuration(ticks: number): string {
  const minutes = Math.round(ticks / 600_000_000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
}

export function calculateProgressPercentage(
  positionTicks: number,
  runTimeTicks: number
): number {
  if (!runTimeTicks) {
    return 0;
  }
  return Math.min(100, Math.round((positionTicks / runTimeTicks) * 100));
}

export function ticksToMinutes(ticks: number): number {
  return Math.round(ticks / 600_000_000);
}
