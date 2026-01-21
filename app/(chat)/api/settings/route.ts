import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  deleteServiceConfig,
  getServiceConfigs,
  upsertServiceConfig,
} from "@/lib/db/queries/service-config";
import type { ServiceConfig } from "@/lib/db/schema";
import { JellyfinClient } from "@/lib/plugins/jellyfin/client";
import { JellyseerrClient } from "@/lib/plugins/jellyseerr/client";
import { QBittorrentClient } from "@/lib/plugins/qbittorrent/client";
import { RadarrClient } from "@/lib/plugins/radarr/client";
import { SonarrClient } from "@/lib/plugins/sonarr/client";

const settingsSchema = z.object({
  serviceName: z.string(),
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
  isEnabled: z.boolean().optional(),
});

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
        await client.get("/api/v2/app/version");
        return true;
      }
      default:
        // For unknown services, assume healthy if configured
        return true;
    }
  } catch {
    // console.error(`Health check failed for ${config.serviceName}:`, error);
    return false;
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configs = await getServiceConfigs({ userId: session.user.id });
  return NextResponse.json(configs);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const body = settingsSchema.parse(json);

    // Initial config for testing
    const tempConfig: ServiceConfig = {
      ...body,
      id: "temp",
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      isEnabled: body.isEnabled ?? true,
    };

    // Verify connection
    const isHealthy = await checkServiceHealth(tempConfig);
    if (!isHealthy) {
      return NextResponse.json(
        {
          error: "Could not connect to service. Please check URL and API Key.",
        },
        { status: 400 }
      );
    }

    const config = await upsertServiceConfig({
      userId: session.user.id,
      ...body,
    });

    return NextResponse.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}

// PUT - Test connection only (does not save)
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const body = settingsSchema.parse(json);

    // Create temp config for testing
    const tempConfig: ServiceConfig = {
      ...body,
      id: "temp",
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      isEnabled: body.isEnabled ?? true,
    };

    // Measure latency
    const startTime = Date.now();
    const isHealthy = await checkServiceHealth(tempConfig);
    const latency = Date.now() - startTime;

    if (!isHealthy) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not connect to service. Please check URL and API Key.",
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
