import { getEnabledUserSkills } from "../db/queries/user-skill";
import { createLogger } from "../logger";
import type { InjectedSkill } from "./types";

const log = createLogger("skills:manager");

/**
 * SkillManager handles loading and injecting skills into the AI prompt.
 * Singleton pattern for consistent access across the application.
 */
export class SkillManager {
  private static instance: SkillManager;

  private constructor() {}

  static getInstance(): SkillManager {
    if (!SkillManager.instance) {
      SkillManager.instance = new SkillManager();
    }
    return SkillManager.instance;
  }

  /**
   * Get all enabled skills for a user session.
   */
  async getSkillsForSession(
    userId: string,
    mode = "chat"
  ): Promise<InjectedSkill[]> {
    try {
      const userSkills = await getEnabledUserSkills({ userId });

      log.debug(
        { userId, skillCount: userSkills.length, mode },
        "Loaded user skills for session"
      );

      // Convert to injected skills format
      return userSkills.map((skill) => ({
        name: skill.name,
        displayName: skill.displayName,
        description: skill.description,
        instructions: skill.instructions,
        source: skill.source,
      }));
    } catch (error) {
      log.error({ error, userId }, "Failed to load skills for session");
      return [];
    }
  }

  /**
   * Generates skill instructions to inject into system prompt.
   * Returns empty string if no skills are available.
   */
  generateSkillPromptSection(skills: InjectedSkill[]): string {
    if (skills.length === 0) {
      return "";
    }

    const lines: string[] = [
      "",
      "## Active Skills",
      "",
      "The following skills provide specialized guidance for this session:",
      "",
    ];

    for (const skill of skills) {
      lines.push(`### ${skill.displayName}`);
      lines.push(`*${skill.description}*`);
      lines.push("");
      lines.push(skill.instructions);
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Generates a compact skill summary for context-aware prompts.
   * Lists just the names and descriptions without full instructions.
   */
  generateSkillSummary(skills: InjectedSkill[]): string {
    if (skills.length === 0) {
      return "";
    }

    const lines: string[] = ["", "## Available Skills", ""];

    for (const skill of skills) {
      lines.push(`- **${skill.displayName}**: ${skill.description}`);
    }

    lines.push("");

    return lines.join("\n");
  }
}

// Export singleton instance
export const skillManager = SkillManager.getInstance();
