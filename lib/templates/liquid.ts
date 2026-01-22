import { Liquid } from "liquidjs";

/**
 * LiquidJS engine configured for AI response formatting
 * Uses whitespace control to ensure proper spacing around variables
 */
export const liquidEngine = new Liquid({
  // Trim whitespace from tags by default
  trimTagLeft: true,
  trimTagRight: true,
  // Trim whitespace from outputs by default
  trimOutputLeft: false,
  trimOutputRight: false,
  // Aggressive whitespace removal
  greedy: true,
  // Strict mode for better error messages
  strictFilters: false,
  strictVariables: false,
});

/**
 * Format a template string with variables using LiquidJS
 * Automatically handles whitespace control
 */
export async function formatTemplate(
  template: string,
  variables: Record<string, unknown>
): Promise<string> {
  return await liquidEngine.parseAndRender(template, variables);
}

/**
 * Synchronous version of formatTemplate
 */
export function formatTemplateSync(
  template: string,
  variables: Record<string, unknown>
): string {
  return liquidEngine.parseAndRenderSync(template, variables);
}

// Custom filters for the liquid engine
liquidEngine.registerFilter("ensure_space_before", (value: string) => {
  if (!value) {
    return "";
  }
  return ` ${value}`;
});
liquidEngine.registerFilter("ensure_space_after", (value: string) => {
  if (!value) {
    return "";
  }
  return `${value} `;
});
liquidEngine.registerFilter("wrap_parens", (value: string | number | null) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  return `(${value})`;
});
liquidEngine.registerFilter(
  "wrap_brackets",
  (value: string | number | null) => {
    if (value === null || value === undefined || value === "") {
      return "";
    }
    return `[${value}]`;
  }
);
