import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  deleteMCPConfig,
  getMCPConfig,
  updateMCPConfig,
} from "@/lib/db/queries/mcp-config";
import { createLogger } from "@/lib/logger";

const log = createLogger("api:settings:mcp");

const updateMCPSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  transport: z.enum(["sse", "http"]).optional(),
  apiKey: z.string().nullable().optional(),
  headers: z.record(z.string()).nullable().optional(),
  isEnabled: z.boolean().optional(),
  availableTools: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        inputSchema: z.any().optional(),
      })
    )
    .nullable()
    .optional(),
});

// GET - Get single MCP config
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const config = await getMCPConfig({ userId: session.user.id, id });

    if (!config) {
      return NextResponse.json(
        { error: "MCP config not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    log.error({ error }, "Failed to get MCP config");
    return NextResponse.json(
      { error: "Failed to get MCP config" },
      { status: 500 }
    );
  }
}

// PATCH - Update MCP config
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const json = await request.json();
    const body = updateMCPSchema.parse(json);

    const config = await updateMCPConfig({
      userId: session.user.id,
      id,
      ...body,
    });

    if (!config) {
      return NextResponse.json(
        { error: "MCP config not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to update MCP config";
    log.error({ error }, "Failed to update MCP config");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE - Delete MCP config
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const config = await deleteMCPConfig({ userId: session.user.id, id });

    if (!config) {
      return NextResponse.json(
        { error: "MCP config not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error({ error }, "Failed to delete MCP config");
    return NextResponse.json(
      { error: "Failed to delete MCP config" },
      { status: 500 }
    );
  }
}
