"use client";

import { CheckCircleIcon } from "lucide-react";
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

interface ErrorResultProps {
  error: string | unknown;
  /** Additional context data (like existingMovie/existingSeries) */
  context?: Record<string, unknown>;
}

/**
 * Error result renderer for tool errors.
 * Shows error message and optional context for "already exists" errors.
 */
export function ErrorResult({ error, context }: ErrorResultProps) {
  const errorMessage = typeof error === "string" ? error : String(error);

  // Check for "already exists" context
  const existingMovie = context?.existingMovie as {
    title?: string;
    id?: number;
    path?: string;
    hasFile?: boolean;
  } | undefined;

  const existingSeries = context?.existingSeries as {
    title?: string;
    id?: number;
    path?: string;
  } | undefined;

  const existingItem = existingMovie || existingSeries;
  const isAlreadyExists = !!existingItem;

  if (isAlreadyExists && existingItem) {
    return (
      <div className="text-xs">
        <div className="flex items-start gap-2 rounded-md border border-blue-500/30 bg-blue-500/5 p-3">
          <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-blue-500" />
          <div className="space-y-1">
            <p className="font-medium text-blue-700 dark:text-blue-300">
              Already in library
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium">{existingItem.title}</span> is already being tracked.
            </p>
            {existingItem.path && (
              <p className="text-muted-foreground/70 text-[10px]">
                {existingItem.path}
              </p>
            )}
            {existingMovie?.hasFile !== undefined && (
              <p className="text-muted-foreground">
                Status: {existingMovie.hasFile ? "Downloaded" : "Wanted"}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-red-400 text-xs py-1">
      <span className="font-medium">Error:</span> {errorMessage}
    </div>
  );
}
