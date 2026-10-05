import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  deleteServiceConfig,
  getServiceConfig,
  getServiceConfigs,
  upsertServiceConfig,
} from "@/lib/db/queries/service-config";
import type { ServiceConfig } from "@/lib/db/schema";
import { demoWriteBlockedResponse } from "@/lib/demo/mode";
import { assertSafeServiceUrl, UnsafeUrlError } from "@/lib/net/ssrf";
import { JellyfinClient } from "@/lib/plugins/jellyfin/client";
import { JellyseerrClient } from "@/lib/plugins/jellyseerr/client";
import { QBittorrentClient } from "@/lib/plugins/qbittorrent/client";
import { RadarrClient } from "@/lib/plugins/radarr/client";
import { SonarrClient } from "@/lib/plugins/sonarr/client";
import { maskServiceConfig, resolveSecret } from "@/lib/settings/mask";

const baseSettingsSchema = z.object({
  serviceName: z.string(),
  baseUrl: z.string().url(),
  isEnabled: z.boolean().optional(),
});

const apiKeySchema = baseSettingsSchema.extend({
  apiKey: z.string().min(1),
});

const credentialsSchema = baseSettingsSchema.extend({
  username: z.string().min(1),
  password: z.string().min(1),
});

type ServiceBody =
  | z.infer<typeof apiKeySchema>
  | z.infer<typeof credentialsSchema>;

class MaskedSecretError extends z.ZodError {}

/**
 * Parse and validate a service payload, check its URL, and swap any masked
 * secret placeholder for the user's stored secret.
 */
async function parseServiceBody(
  request: Request,
  userId: string
): Promise<ServiceBody> {
  const json = await request.json();
  const body: ServiceBody =
    json.serviceName === "qbittorrent"
      ? credentialsSchema.parse(json)
      : apiKeySchema.parse(json);

  await assertSafeServiceUrl(body.baseUrl);

  const stored = await getServiceConfig({
    userId,
    serviceName: body.serviceName,
  });
  if ("apiKey" in body) {
    body.apiKey = resolveSecret(body.apiKey, stored?.apiKey);
  }
  if ("password" in body) {
    body.password = resolveSecret(body.password, stored?.password);
  }
  if (
    ("apiKey" in body && !body.apiKey) ||
    ("password" in body && !body.password)
  ) {
    // Placeholder sent but nothing stored to restore.
    throw new MaskedSecretError([]);
  }
  return body;
}

async function checkServiceHealth(config: ServiceConfig): Promise<boolean> {
  try {
    switch (config.serviceName) {
      case "radarr": {
        const client = new RadarrClient(config);
        await client.get("/api/v3/system/status");
        return true;
      }
      case "sonarr": {
        const client = new SonarrClient(config);
        await client.get("/api/v3/system/status");
        return true;
      }
      case "jellyseerr": {
        const client = new JellyseerrClient(config);
        await client.get("/api/v1/status");
        return true;
      }
      case "jellyfin": {
        const client = new JellyfinClient(config);
        await client.get("/System/Info/Public");
        return true;
      }
      case "qbittorrent": {
        const client = new QBittorrentClient(config);
        await client.getAppVersion();
        return true;
      }
      default:
        return true;
    }
  } catch {
    return false;
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configs = await getServiceConfigs({ userId: session.user.id });
  return NextResponse.json(configs.map(maskServiceConfig));
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: validation branches
export async function POST(request: Request) {
  const demoBlocked = demoWriteBlockedResponse();
  if (demoBlocked) {
    return demoBlocked;
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await parseServiceBody(request, session.user.id);

    const tempConfig: ServiceConfig = {
      id: "temp",
      userId: session.user.id,
      serviceName: body.serviceName,
      baseUrl: body.baseUrl,
      apiKey: "apiKey" in body ? body.apiKey : "",
      username: "username" in body ? body.username : null,
      password: "password" in body ? body.password : null,
      isEnabled: body.isEnabled ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const isHealthy = await checkServiceHealth(tempConfig);
    if (!isHealthy) {
      return NextResponse.json(
        {
          error:
            "Could not connect to service. Please check URL and credentials.",
        },
        { status: 400 }
      );
    }

    const config = await upsertServiceConfig({
      userId: session.user.id,
      serviceName: body.serviceName,
      baseUrl: body.baseUrl,
      apiKey: "apiKey" in body ? body.apiKey : "",
      username: "username" in body ? body.username : null,
      password: "password" in body ? body.password : null,
      isEnabled: body.isEnabled ?? true,
    });

    return NextResponse.json(maskServiceConfig(config));
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const demoBlocked = demoWriteBlockedResponse();
  if (demoBlocked) {
    return demoBlocked;
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await parseServiceBody(request, session.user.id);

    const tempConfig: ServiceConfig = {
      id: "temp",
      userId: session.user.id,
      serviceName: body.serviceName,
      baseUrl: body.baseUrl,
      apiKey: "apiKey" in body ? body.apiKey : "",
      username: "username" in body ? body.username : null,
      password: "password" in body ? body.password : null,
      isEnabled: body.isEnabled ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const startTime = Date.now();
    const isHealthy = await checkServiceHealth(tempConfig);
    const latency = Date.now() - startTime;

    if (!isHealthy) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Could not connect to service. Please check URL and credentials.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Connection successful",
      latency,
    });
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid data" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to test connection" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const demoBlocked = demoWriteBlockedResponse();
  if (demoBlocked) {
    return demoBlocked;
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const serviceName = searchParams.get("serviceName");

  if (!serviceName) {
    return NextResponse.json(
      { error: "Service name required" },
      { status: 400 }
    );
  }

  await deleteServiceConfig({
    userId: session.user.id,
    serviceName,
  });

  return NextResponse.json({ success: true });
}
