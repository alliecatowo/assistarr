import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";
import { HEALTH_CHECK_TIMEOUT_MS } from "@/lib/plugins/core/client";

interface JellyseerrServiceConfig {
  id: number;
  name: string;
  hostname: string;
  port: number;
  apiKey: string;
  useSsl: boolean;
  isDefault: boolean;
  activeProfileId: number;
  activeProfileName: string;
  activeDirectory: string;
  is4k: boolean;
  minimumAvailability?: string;
  tags?: number[];
  externalUrl?: string;
}

interface DiscoverRequest {
  jellyseerrBaseUrl: string;
  jellyseerrApiKey: string;
}

interface DiscoverResponse {
  radarr?: { baseUrl: string; apiKey: string };
  sonarr?: { baseUrl: string; apiKey: string };
}

async function fetchJellyseerrService(
  baseUrl: string,
  apiKey: string,
  servicePath: string
): Promise<JellyseerrServiceConfig[] | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    HEALTH_CHECK_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${baseUrl}/api/v1/settings/${servicePath}`, {
      method: "GET",
      headers: {
        "X-Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return Array.isArray(data) ? data : null;
  } catch (_error) {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildBaseUrl(config: JellyseerrServiceConfig): string {
  const protocol = config.useSsl ? "https" : "http";
  return `${protocol}://${config.hostname}:${config.port}`;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:settings").toResponse();
  }

  try {
    const body: DiscoverRequest = await request.json();
    const { jellyseerrBaseUrl, jellyseerrApiKey } = body;

    if (!jellyseerrBaseUrl || !jellyseerrApiKey) {
      return new ChatSDKError(
        "bad_request:settings",
        "jellyseerrBaseUrl and jellyseerrApiKey are required"
      ).toResponse();
    }

    // Normalize the base URL (remove trailing slash)
    const normalizedBaseUrl = jellyseerrBaseUrl.replace(/\/$/, "");

    // Fetch Radarr and Sonarr configurations in parallel
    // Use Promise.allSettled for better error tolerance - either service can fail independently
    const [radarrResult, sonarrResult] = await Promise.allSettled([
      fetchJellyseerrService(normalizedBaseUrl, jellyseerrApiKey, "radarr"),
      fetchJellyseerrService(normalizedBaseUrl, jellyseerrApiKey, "sonarr"),
    ]);

    // Extract results with null fallback for rejected promises
    const radarrConfigs =
      radarrResult.status === "fulfilled" ? radarrResult.value : null;
    const sonarrConfigs =
      sonarrResult.status === "fulfilled" ? sonarrResult.value : null;

    const response: DiscoverResponse = {};

    // Take the first Radarr server if available
    if (radarrConfigs && radarrConfigs.length > 0) {
      const radarrConfig = radarrConfigs[0];
      response.radarr = {
        baseUrl: buildBaseUrl(radarrConfig),
        apiKey: radarrConfig.apiKey,
      };
    }

    // Take the first Sonarr server if available
    if (sonarrConfigs && sonarrConfigs.length > 0) {
      const sonarrConfig = sonarrConfigs[0];
      response.sonarr = {
        baseUrl: buildBaseUrl(sonarrConfig),
        apiKey: sonarrConfig.apiKey,
      };
    }

    return Response.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to discover services";
    return new ChatSDKError("bad_request:settings", message).toResponse();
  }
}
