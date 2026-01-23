import { and, eq } from "drizzle-orm";
import { ChatSDKError } from "../../errors";
import { createLogger } from "../../logger";
import { db } from "../db";
import { type UserSkill, userSkill } from "../schema";

const log = createLogger("db:user-skill");

export async function getUserSkills({
  userId,
}: {
  userId: string;
}): Promise<UserSkill[]> {
  try {
    log.debug({ userId }, "Fetching user skills");
    const skills = await db
      .select()
      .from(userSkill)
      .where(eq(userSkill.userId, userId));

    return skills;
  } catch (_error) {
    log.error({ error: _error, userId }, "Failed to get user skills");
    throw new ChatSDKError("bad_request:database", "Failed to get user skills");
  }
}

export async function getUserSkill({
  userId,
  id,
}: {
  userId: string;
  id: string;
}): Promise<UserSkill | null> {
  try {
    log.debug({ userId, id }, "Fetching user skill");
    const [skill] = await db
      .select()
      .from(userSkill)
      .where(and(eq(userSkill.userId, userId), eq(userSkill.id, id)));

    if (!skill) {
      log.debug({ userId, id }, "User skill not found");
      return null;
    }

    return skill;
  } catch (_error) {
    log.error({ error: _error, userId, id }, "Failed to get user skill");
    throw new ChatSDKError("bad_request:database", "Failed to get user skill");
  }
}

export async function getUserSkillByName({
  userId,
  name,
}: {
  userId: string;
  name: string;
}): Promise<UserSkill | null> {
  try {
    log.debug({ userId, name }, "Fetching user skill by name");
    const [skill] = await db
      .select()
      .from(userSkill)
      .where(and(eq(userSkill.userId, userId), eq(userSkill.name, name)));

    if (!skill) {
      return null;
    }

    return skill;
  } catch (_error) {
    log.error({ error: _error, userId, name }, "Failed to get user skill");
    throw new ChatSDKError("bad_request:database", "Failed to get user skill");
  }
}

export async function createUserSkill({
  userId,
  name,
  displayName,
  description,
  instructions,
  isEnabled = true,
  source = "user",
  pluginName,
}: {
  userId: string;
  name: string;
  displayName: string;
  description: string;
  instructions: string;
  isEnabled?: boolean;
  source?: "user" | "plugin" | "builtin";
  pluginName?: string;
}): Promise<UserSkill> {
  try {
    log.info(
      { userId, name, displayName, source, pluginName },
      "Creating user skill"
    );

    // Check for duplicate name
    const existing = await getUserSkillByName({ userId, name });
    if (existing) {
      throw new ChatSDKError(
        "bad_request:validation",
        `Skill with name "${name}" already exists`
      );
    }

    const [newSkill] = await db
      .insert(userSkill)
      .values({
        userId,
        name,
        displayName,
        description,
        instructions,
        isEnabled,
        source,
        pluginName,
      })
      .returning();

    return newSkill;
  } catch (_error) {
    if (_error instanceof ChatSDKError) {
      throw _error;
    }
    log.error({ error: _error, userId, name }, "Failed to create user skill");
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create user skill"
    );
  }
}

export async function updateUserSkill({
  userId,
  id,
  name,
  displayName,
  description,
  instructions,
  isEnabled,
}: {
  userId: string;
  id: string;
  name?: string;
  displayName?: string;
  description?: string;
  instructions?: string;
  isEnabled?: boolean;
}): Promise<UserSkill | null> {
  try {
    log.info({ userId, id, name, displayName, isEnabled }, "Updating user skill");

    // If name is changing, check for duplicates
    if (name) {
      const existing = await getUserSkillByName({ userId, name });
      if (existing && existing.id !== id) {
        throw new ChatSDKError(
          "bad_request:validation",
          `Skill with name "${name}" already exists`
        );
      }
    }

    const updateData: Partial<UserSkill> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (description !== undefined) updateData.description = description;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;

    const [updatedSkill] = await db
      .update(userSkill)
      .set(updateData)
      .where(and(eq(userSkill.userId, userId), eq(userSkill.id, id)))
      .returning();

    if (!updatedSkill) {
      return null;
    }

    return updatedSkill;
  } catch (_error) {
    if (_error instanceof ChatSDKError) {
      throw _error;
    }
    log.error({ error: _error, userId, id }, "Failed to update user skill");
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update user skill"
    );
  }
}

export async function deleteUserSkill({
  userId,
  id,
}: {
  userId: string;
  id: string;
}): Promise<UserSkill | null> {
  try {
    log.info({ userId, id }, "Deleting user skill");
    const [deletedSkill] = await db
      .delete(userSkill)
      .where(and(eq(userSkill.userId, userId), eq(userSkill.id, id)))
      .returning();

    if (!deletedSkill) {
      return null;
    }

    return deletedSkill;
  } catch (_error) {
    log.error({ error: _error, userId, id }, "Failed to delete user skill");
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete user skill"
    );
  }
}

export async function getEnabledUserSkills({
  userId,
}: {
  userId: string;
}): Promise<UserSkill[]> {
  try {
    log.debug({ userId }, "Fetching enabled user skills");
    const skills = await db
      .select()
      .from(userSkill)
      .where(
        and(eq(userSkill.userId, userId), eq(userSkill.isEnabled, true))
      );

    return skills;
  } catch (_error) {
    log.error({ error: _error, userId }, "Failed to get enabled user skills");
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get enabled user skills"
    );
  }
}

export async function upsertPluginSkill({
  userId,
  name,
  displayName,
  description,
  instructions,
  pluginName,
}: {
  userId: string;
  name: string;
  displayName: string;
  description: string;
  instructions: string;
  pluginName: string;
}): Promise<UserSkill> {
  try {
    log.info(
      { userId, name, pluginName },
      "Upserting plugin skill"
    );

    const existing = await getUserSkillByName({ userId, name });

    if (existing) {
      // Update existing skill (but preserve user's isEnabled preference)
      const [updatedSkill] = await db
        .update(userSkill)
        .set({
          displayName,
          description,
          instructions,
          pluginName,
          source: "plugin",
          updatedAt: new Date(),
        })
        .where(and(eq(userSkill.userId, userId), eq(userSkill.name, name)))
        .returning();

      return updatedSkill;
    }

    // Create new plugin skill
    const [newSkill] = await db
      .insert(userSkill)
      .values({
        userId,
        name,
        displayName,
        description,
        instructions,
        isEnabled: true,
        source: "plugin",
        pluginName,
      })
      .returning();

    return newSkill;
  } catch (_error) {
    log.error(
      { error: _error, userId, name, pluginName },
      "Failed to upsert plugin skill"
    );
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to upsert plugin skill"
    );
  }
}
