import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  deleteUserSkill,
  getUserSkill,
  updateUserSkill,
} from "@/lib/db/queries/user-skill";
import { createLogger } from "@/lib/logger";

const log = createLogger("api:settings:skills");

const updateSkillSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  displayName: z.string().min(1).max(200).optional(),
  description: z.string().min(10).max(500).optional(),
  instructions: z.string().min(20).max(50_000).optional(),
  isEnabled: z.boolean().optional(),
});

// GET - Get single skill
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
    const skill = await getUserSkill({ userId: session.user.id, id });

    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    return NextResponse.json(skill);
  } catch (error) {
    log.error({ error }, "Failed to get skill");
    return NextResponse.json({ error: "Failed to get skill" }, { status: 500 });
  }
}

// PATCH - Update skill
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

    // Check if skill exists and user owns it
    const existingSkill = await getUserSkill({ userId: session.user.id, id });
    if (!existingSkill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    // Don't allow editing plugin or builtin skills (except isEnabled)
    const json = await request.json();
    const body = updateSkillSchema.parse(json);

    // Only allow toggling isEnabled for non-user skills
    if (
      existingSkill.source !== "user" &&
      Object.keys(body).some((key) => key !== "isEnabled")
    ) {
      return NextResponse.json(
        { error: "Cannot edit plugin or builtin skills" },
        { status: 403 }
      );
    }

    const skill = await updateUserSkill({
      userId: session.user.id,
      id,
      ...body,
    });

    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    return NextResponse.json(skill);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to update skill";
    log.error({ error }, "Failed to update skill");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE - Delete skill
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

    // Check if skill exists and user owns it
    const existingSkill = await getUserSkill({ userId: session.user.id, id });
    if (!existingSkill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    // Don't allow deleting plugin skills
    if (existingSkill.source === "plugin") {
      return NextResponse.json(
        { error: "Cannot delete plugin skills" },
        { status: 403 }
      );
    }

    const skill = await deleteUserSkill({ userId: session.user.id, id });

    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error({ error }, "Failed to delete skill");
    return NextResponse.json(
      { error: "Failed to delete skill" },
      { status: 500 }
    );
  }
}
