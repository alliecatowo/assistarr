import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createUserSkill,
  getUserSkills,
} from "@/lib/db/queries/user-skill";
import {
  generateDisplayName,
  parseSkillContent,
  validateSkillContent,
} from "@/lib/skills";

const createSkillSchema = z.object({
  content: z.string().min(1),
});

// GET - List all skills for user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const skills = await getUserSkills({ userId: session.user.id });
    return NextResponse.json(skills);
  } catch (error) {
    console.error("Failed to get skills:", error);
    return NextResponse.json(
      { error: "Failed to get skills" },
      { status: 500 }
    );
  }
}

// POST - Create new skill from SKILL.md content
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const body = createSkillSchema.parse(json);

    // Validate the skill content
    const validation = validateSkillContent(body.content);
    if (!validation.valid || !validation.parsed) {
      return NextResponse.json(
        { error: "Invalid skill content", errors: validation.errors },
        { status: 400 }
      );
    }

    const { frontmatter, instructions } = validation.parsed;

    // Generate display name if not in frontmatter
    const displayName =
      frontmatter.name
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") || generateDisplayName(frontmatter.name);

    const skill = await createUserSkill({
      userId: session.user.id,
      name: frontmatter.name,
      displayName,
      description: frontmatter.description,
      instructions,
      isEnabled: true,
      source: "user",
    });

    return NextResponse.json(skill);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to create skill";
    console.error("Failed to create skill:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
