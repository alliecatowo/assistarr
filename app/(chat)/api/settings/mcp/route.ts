import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { createMCPConfig, getMCPConfigs } from "@/lib/db/queries/mcp-config";
import { createLogger } from "@/lib/logger";
import { checkMCPHealth } from "@/lib/mcp";

const log = createLogger("api:settings:mcp");

const createMCPSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url(),
  transport: z.enum(["sse", "http"]).default("sse"),
  apiKey: z.string().optional(),
  headers: z.record(z.string()).optional(),
  isEnabled: z.boolean().optional(),
});

const testMCPSchema = z.object({
  url: z.string().url(),
  transport: z.enum(["sse", "http"]).default("sse"),
  apiKey: z.string().optional(),
});

// GET - List all MCP configs for user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const configs = await getMCPConfigs({ userId: session.user.id });
    return NextResponse.json(configs);
  } catch (error) {
    log.error({ error }, "Failed to get MCP configs");
    return NextResponse.json(
      { error: "Failed to get MCP configs" },
      { status: 500 }
    );
  }
}

// POST - Create new MCP config
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const body = createMCPSchema.parse(json);

    const config = await createMCPConfig({
      userId: session.user.id,
      name: body.name,
      url: body.url,
      transport: body.transport,
      apiKey: body.apiKey,
      headers: body.headers,
      isEnabled: body.isEnabled ?? true,
    });

    return NextResponse.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to create MCP config";
    log.error({ error }, "Failed to create MCP config");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// PUT - Test MCP connection (no save)
export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const body = testMCPSchema.parse(json);

    const result = await checkMCPHealth({
      url: body.url,
      transport: body.transport,
      apiKey: body.apiKey,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    log.error({ error }, "MCP connection test failed");
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Connection test failed",
      },
      { status: 200 } // Return 200 with success: false for test failures
    );
  }
}
