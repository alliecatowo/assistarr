import type { MediaStatus } from "./types";

/**
 * Helper to derive display status from Radarr/Sonarr fields
 */
export function deriveMediaStatus(
  hasFile?: boolean,
  monitored?: boolean,
  isAvailable?: boolean,
  isPending?: boolean
): MediaStatus {
  if (isAvailable || hasFile) {
    return "available";
  }
  if (isPending) {
    return "requested";
  }
  if (monitored) {
    return "wanted";
  }
  return "missing";
}
