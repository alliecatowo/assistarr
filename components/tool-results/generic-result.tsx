"use client";

import type { ToolResultProps } from "./types";

interface GenericResultProps extends ToolResultProps {
  output: unknown;
}

/**
 * Fallback renderer that displays tool output as formatted JSON.
 * Used when no specialized renderer exists for a tool.
 */
export function GenericResult({ output }: GenericResultProps) {
  if (output === null || output === undefined) {
    return (
      <div className="text-xs text-muted-foreground py-1">
        No output returned
      </div>
    );
  }

  return (
    <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border border-border/50 max-h-60 overflow-y-auto whitespace-pre-wrap font-mono">
      {JSON.stringify(output, null, 2)}
    </div>
  );
}

/**
 * Error result renderer for tool errors.
 */
export function ErrorResult({ error }: { error: string | unknown }) {
  const errorMessage = typeof error === "string" ? error : String(error);

  return (
    <div className="text-red-400 text-xs py-1">
      <span className="font-medium">Error:</span> {errorMessage}
    </div>
  );
}
