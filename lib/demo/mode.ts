import { ChatSDKError } from "@/lib/errors";

/**
 * Public demo mode. Enabled with DEMO_MODE=true.
 *
 * - *arr/qBittorrent/Jellyfin/Jellyseerr calls are answered in-process from
 *   fixtures (see lib/demo/servarr.ts); nothing external is contacted.
 * - Without an AI key the chat uses a scripted, tool-calling model.
 * - Anything that could make the server fetch user-supplied URLs or store
 *   user-supplied credentials/prompts is refused.
 */
export const DEMO_BASE_URL = "http://demo.invalid";

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export function hasAIProviderKey(): boolean {
  return Boolean(
    process.env.OPENROUTER_API_KEY || process.env.AI_GATEWAY_API_KEY
  );
}

/** True when the demo should answer with the scripted model instead of an LLM. */
export function shouldUseScriptedModel(): boolean {
  return isDemoMode() && !hasAIProviderKey();
}

/** Throw a 403 when a write that is unsafe on a public demo is attempted. */
export function assertNotDemo(): void {
  if (isDemoMode()) {
    throw new ChatSDKError(
      "forbidden:settings",
      "This is a read-only public demo. Install Assistarr yourself to change settings."
    );
  }
}
