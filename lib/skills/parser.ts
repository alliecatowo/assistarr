import { createLogger } from "../logger";
import type {
  ParsedSkill,
  SkillFrontmatter,
  SkillValidationResult,
} from "./types";

const log = createLogger("skills:parser");

// Frontmatter delimiter
const FRONTMATTER_DELIMITER = "---";

/**
 * Parses an inline array like [a, b, c]
 */
function parseInlineArray(value: string): string[] {
  const arrayContent = value.slice(1, -1);
  return arrayContent
    .split(",")
    .map((v) => v.trim().replace(/^["']|["']$/g, ""))
    .filter((v) => v);
}

/**
 * Parses a single YAML value into its appropriate type
 */
function parseYAMLValue(value: string): unknown {
  if (value.startsWith("[") && value.endsWith("]")) {
    return parseInlineArray(value);
  }
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (!Number.isNaN(Number(value))) {
    return Number(value);
  }
  return value;
}

/**
 * Parses YAML frontmatter manually.
 * Supports basic key: value pairs and simple arrays.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: YAML parsing requires handling multiple syntax cases
function parseYAMLFrontmatter(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.trim().split("\n");

  let currentKey = "";
  let inArray = false;
  let arrayValues: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      continue;
    }

    // Check for array continuation
    if (trimmed.startsWith("- ") && inArray && currentKey) {
      arrayValues.push(trimmed.slice(2).trim());
      continue;
    }

    // End previous array if we're not continuing
    if (inArray && currentKey) {
      result[currentKey] = arrayValues;
      inArray = false;
      arrayValues = [];
      currentKey = "";
    }

    // Parse key: value
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex > 0) {
      const key = trimmed.slice(0, colonIndex).trim();
      const value = trimmed.slice(colonIndex + 1).trim();

      if (value === "") {
        // Start of array or empty value
        currentKey = key;
        inArray = true;
        arrayValues = [];
      } else {
        result[key] = parseYAMLValue(value);
      }
    }
  }

  // Handle any remaining array
  if (inArray && currentKey) {
    result[currentKey] = arrayValues;
  }

  return result;
}

/**
 * Parses a SKILL.md content string into frontmatter and instructions.
 */
export function parseSkillContent(content: string): ParsedSkill | null {
  const trimmed = content.trim();

  // Check for frontmatter
  if (!trimmed.startsWith(FRONTMATTER_DELIMITER)) {
    log.debug("No frontmatter delimiter found");
    return null;
  }

  // Find the second delimiter
  const secondDelimiterIndex = trimmed.indexOf(
    FRONTMATTER_DELIMITER,
    FRONTMATTER_DELIMITER.length
  );

  if (secondDelimiterIndex === -1) {
    log.debug("No closing frontmatter delimiter found");
    return null;
  }

  // Extract frontmatter YAML
  const frontmatterYAML = trimmed.slice(
    FRONTMATTER_DELIMITER.length,
    secondDelimiterIndex
  );

  // Extract instructions (everything after the second delimiter)
  const instructions = trimmed
    .slice(secondDelimiterIndex + FRONTMATTER_DELIMITER.length)
    .trim();

  // Parse YAML frontmatter
  const parsed = parseYAMLFrontmatter(frontmatterYAML);

  // Validate required fields
  if (!parsed.name || typeof parsed.name !== "string") {
    log.debug("Missing or invalid 'name' in frontmatter");
    return null;
  }

  if (!parsed.description || typeof parsed.description !== "string") {
    log.debug("Missing or invalid 'description' in frontmatter");
    return null;
  }

  const frontmatter: SkillFrontmatter = {
    name: parsed.name as string,
    description: parsed.description as string,
    requiredTools: Array.isArray(parsed.requiredTools)
      ? (parsed.requiredTools as string[])
      : undefined,
    modes: Array.isArray(parsed.modes) ? (parsed.modes as string[]) : undefined,
    category: typeof parsed.category === "string" ? parsed.category : undefined,
  };

  return {
    frontmatter,
    instructions,
  };
}

/**
 * Validates a skill markdown content.
 */
export function validateSkillContent(content: string): SkillValidationResult {
  const errors: string[] = [];

  if (!content || typeof content !== "string") {
    return { valid: false, errors: ["Content is required"] };
  }

  if (!content.trim().startsWith(FRONTMATTER_DELIMITER)) {
    return {
      valid: false,
      errors: ["Skill must start with YAML frontmatter (---)"],
    };
  }

  const parsed = parseSkillContent(content);

  if (!parsed) {
    return {
      valid: false,
      errors: ["Failed to parse skill content. Check frontmatter format."],
    };
  }

  // Validate name format
  if (!/^[a-z0-9-]+$/.test(parsed.frontmatter.name)) {
    errors.push(
      "Name must be lowercase alphanumeric with hyphens only (e.g., 'my-skill')"
    );
  }

  if (parsed.frontmatter.name.length > 100) {
    errors.push("Name must be 100 characters or less");
  }

  // Validate description
  if (parsed.frontmatter.description.length < 10) {
    errors.push("Description must be at least 10 characters");
  }

  if (parsed.frontmatter.description.length > 500) {
    errors.push("Description must be 500 characters or less");
  }

  // Validate instructions
  if (!parsed.instructions || parsed.instructions.length < 20) {
    errors.push("Instructions must be at least 20 characters");
  }

  if (parsed.instructions && parsed.instructions.length > 50_000) {
    errors.push("Instructions must be 50,000 characters or less");
  }

  return {
    valid: errors.length === 0,
    errors,
    parsed: errors.length === 0 ? parsed : undefined,
  };
}

/**
 * Generates a display name from a skill name.
 * Converts "my-skill-name" to "My Skill Name"
 */
export function generateDisplayName(name: string): string {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
