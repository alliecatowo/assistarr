import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLogger } from "@/lib/logger";
import type { ToolDefinition } from "@/lib/plugins/core/types";
import { pluginManager } from "@/lib/plugins/registry";
import type { InjectedSkill } from "@/lib/skills";
import { formatTemplateSync } from "@/lib/templates/liquid";
import type { RequestHints } from "./prompts";

const log = createLogger("prompt-engine");

// Get the directory of the current module file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Cache templates in memory to avoid reading disk on every request
const templateCache = new Map<string, string>();

function getTemplate(name: string): string {
  const cached = templateCache.get(name);
  if (cached) {
    return cached;
  }

  // Resolve path to templates relative to this file
  const templatePath = path.join(__dirname, "templates", `${name}.liquid`);

  try {
    const content = fs.readFileSync(templatePath, "utf-8");
    templateCache.set(name, content);
    return content;
  } catch (error) {
    log.error({ err: error, templateName: name }, "Failed to load template");
    throw new Error(`Template not found: ${name}`);
  }
}

export type PromptOptions = {
  mode?: "chat" | "discover";
  debugMode?: boolean;
  requestHints: RequestHints;
  artifactsPrompt?: string; // Optional prompt injected for artifacts
  skills?: InjectedSkill[]; // Optional skills to inject
};

export function generateSystemPrompt(options: PromptOptions): string {
  const {
    mode = "chat",
    debugMode = false,
    requestHints,
    artifactsPrompt,
    skills = [],
  } = options;

  // 1. Select Template
  let templateName = "system"; // default regular prompt
  if (mode === "discover") {
    templateName = "discover";
  } else if (debugMode) {
    templateName = "debug";
  }

  const templateContent = getTemplate(templateName);

  // 2. Prepare Data Context
  // Get plugins and map them to a simple structure for Liquid
  // We sort tools by name for consistency
  const plugins = pluginManager.getPlugins().map((plugin) => ({
    displayName: plugin.displayName,
    tools: Object.entries(plugin.tools)
      .map(([name, def]) => {
        const toolDef = def as ToolDefinition;
        return {
          name,
          description: toolDef.description,
          category: toolDef.category,
          metadata: toolDef.metadata,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));

  // 3. Render template
  let prompt = formatTemplateSync(templateContent, {
    plugins,
    requestHints,
    mode,
    artifactsPrompt,
  });

  // 4. Append skills if any
  if (skills.length > 0) {
    prompt += generateSkillsSection(skills);
  }

  return prompt;
}

/**
 * Generates a skills section to append to the system prompt.
 */
function generateSkillsSection(skills: InjectedSkill[]): string {
  if (skills.length === 0) {
    return "";
  }

  const lines: string[] = [
    "",
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
