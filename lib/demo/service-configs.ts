import type { ServiceConfig } from "@/lib/db/schema";
import { DEMO_BASE_URL } from "./mode";

const SERVICES = [
  "radarr",
  "sonarr",
  "qbittorrent",
  "jellyfin",
  "jellyseerr",
] as const;

/** Synthetic, always-enabled service configs for the public demo. */
export function demoServiceConfigs(userId: string): ServiceConfig[] {
  const now = new Date("2026-01-01T00:00:00Z");
  return SERVICES.map((serviceName) => ({
    id: `00000000-0000-4000-8000-${String(SERVICES.indexOf(serviceName)).padStart(12, "0")}`,
    userId,
    serviceName,
    baseUrl: `${DEMO_BASE_URL}/${serviceName}`,
    apiKey: "demo-key",
    username: serviceName === "qbittorrent" ? "demo" : null,
    password: serviceName === "qbittorrent" ? "demo" : null,
    isEnabled: true,
    createdAt: now,
    updatedAt: now,
  }));
}
