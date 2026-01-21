import { auth } from "@/app/(auth)/auth";
import { checkServiceHealth } from "@/lib/ai/tools/services/registry";
import {
  deleteServiceConfig,
  getServiceConfigs,
  upsertServiceConfig,
} from "@/lib/db/queries/index";
import { ChatSDKError } from "@/lib/errors";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:settings").toResponse();
  }

  try {
    const configs = await getServiceConfigs({ userId: session.user.id });
    return Response.json(configs);
  } catch (_error) {
    return new ChatSDKError(
      "bad_request:settings",
      "Failed to fetch service configurations"
    ).toResponse();
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:settings").toResponse();
  }

  try {
    const body = await request.json();
    const { serviceName, baseUrl, apiKey, isEnabled } = body;

    if (!serviceName || !baseUrl || !apiKey) {
      return new ChatSDKError(
        "bad_request:settings",
        "serviceName, baseUrl, and apiKey are required"
      ).toResponse();
    }

    const validServices = [
      "radarr",
      "sonarr",
      "jellyfin",
      "jellyseerr",
      "qbittorrent",
      "portainer",
    ];
    if (!validServices.includes(serviceName)) {
      return new ChatSDKError(
        "bad_request:settings",
        "Invalid service name"
      ).toResponse();
    }

    const config = await upsertServiceConfig({
      userId: session.user.id,
      serviceName,
      baseUrl,
      apiKey,
      isEnabled: isEnabled ?? true,
    });

    return Response.json(config);
  } catch (_error) {
    return new ChatSDKError(
      "bad_request:settings",
      "Failed to save service configuration"
    ).toResponse();
  }
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:settings").toResponse();
  }

  try {
    const body = await request.json();
    const { serviceName } = body;

    if (!serviceName) {
      return new ChatSDKError(
        "bad_request:settings",
        "serviceName is required"
      ).toResponse();
    }

    const deleted = await deleteServiceConfig({
      userId: session.user.id,
      serviceName,
    });

    if (!deleted) {
      return new ChatSDKError(
        "not_found:settings",
        "Service configuration not found"
      ).toResponse();
    }

    return Response.json({ success: true });
  } catch (_error) {
    return new ChatSDKError(
      "bad_request:settings",
      "Failed to delete service configuration"
    ).toResponse();
  }
}

/**
 * Test connection to a service without saving.
 * PUT /api/settings
 */
export async function PUT(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:settings").toResponse();
  }

  try {
    const body = await request.json();
    const { serviceName, baseUrl, apiKey } = body;

    if (!serviceName || !baseUrl || !apiKey) {
      return new ChatSDKError(
        "bad_request:settings",
        "serviceName, baseUrl, and apiKey are required"
      ).toResponse();
    }

    const validServices = [
      "radarr",
      "sonarr",
      "jellyfin",
      "jellyseerr",
      "qbittorrent",
      "portainer",
    ];
    if (!validServices.includes(serviceName)) {
      return new ChatSDKError(
        "bad_request:settings",
        "Invalid service name"
      ).toResponse();
    }

    // Create a temporary config object for health check
    const tempConfig = {
      id: "",
      userId: session.user.id,
      serviceName,
      baseUrl: baseUrl.replace(/\/$/, ""), // Remove trailing slash
      apiKey,
      isEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Measure latency
    const startTime = performance.now();
    const isHealthy = await checkServiceHealth(serviceName, tempConfig);
    const latency = Math.round(performance.now() - startTime);

    if (isHealthy) {
      return Response.json({
        success: true,
        latency,
        message: `Connected successfully (${latency}ms)`,
      });
    }

    return Response.json({
      success: false,
      error: "Connection failed. Check your URL and API key.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connection test failed";
    return Response.json({
      success: false,
      error: message,
    });
  }
}
