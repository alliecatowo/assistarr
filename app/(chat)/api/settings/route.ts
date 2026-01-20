import { auth } from "@/app/(auth)/auth";
import {
  deleteServiceConfig,
  getServiceConfigs,
  upsertServiceConfig,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:settings").toResponse();
  }

  try {
    const configs = await getServiceConfigs({ userId: session.user.id });
    return Response.json(configs);
  } catch (error) {
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

    const validServices = ["radarr", "sonarr", "jellyfin", "jellyseerr", "qbittorrent", "portainer"];
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
  } catch (error) {
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
  } catch (error) {
    return new ChatSDKError(
      "bad_request:settings",
      "Failed to delete service configuration"
    ).toResponse();
  }
}
