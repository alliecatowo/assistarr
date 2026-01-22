import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLogger } from "@/lib/logger";
import type { ToolDefinition } from "@/lib/plugins/core/types";
import { pluginManager } from "@/lib/plugins/registry";
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
};

export function generateSystemPrompt(options: PromptOptions): string {
  const {
    mode = "chat",
    debugMode = false,
    requestHints,
    artifactsPrompt,
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

  // 3. Render
  return formatTemplateSync(templateContent, {
    plugins,
    requestHints,
    mode,
    artifactsPrompt,
  });
}
