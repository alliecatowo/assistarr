// Re-export the database type
export type { UserSkill } from "../db/schema";

// Frontmatter fields from SKILL.md
export interface SkillFrontmatter {
  name: string;
  description: string;
  // Optional metadata
  requiredTools?: string[];
  modes?: string[];
  category?: string;
}

// Parsed result from SKILL.md content
export interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  instructions: string;
}

// Skill validation result
export interface SkillValidationResult {
  valid: boolean;
  errors: string[];
  parsed?: ParsedSkill;
}

// Skill for injection into system prompt
export interface InjectedSkill {
  name: string;
  displayName: string;
  description: string;
  instructions: string;
  source: "user" | "plugin" | "builtin";
}

// Bundled skill from a plugin
export interface BundledSkill {
  name: string;
  displayName: string;
  description: string;
  instructions: string;
}
