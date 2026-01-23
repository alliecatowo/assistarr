import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { updateUserModelTier } from "@/lib/db/queries/user-ai-config";

const tierUpdateSchema = z.object({
  providerName: z.string(),
  preferredModelTier: z.enum(["lite", "fast", "heavy", "thinking"]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { providerName, preferredModelTier } = tierUpdateSchema.parse(body);

    const updatedConfig = await updateUserModelTier({
      userId: session.user.id,
      providerName,
      preferredModelTier,
    });

    if (!updatedConfig) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      preferredModelTier: updatedConfig.preferredModelTier,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update model tier" },
      { status: 500 }
    );
  }
}
