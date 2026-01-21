"use client";

import type { ReactNode } from "react";
import { ArtifactWrapper } from "./artifact-wrapper";
import { CalendarView } from "./calendar-view";
import type { DisplayContext, DisplayResultType } from "./display";
import { ErrorResult, GenericResult } from "./generic-result";
import { MediaResultsView } from "./media-results-view";
import { QueueView } from "./queue-view";
import { SuccessCard } from "./success-card";
import {
  detectResultType,
  type SuccessConfirmationShape,
  type ToolState,
} from "./types";

interface ToolResultRendererProps {
  toolName: string;
  output: unknown;
  state: ToolState;
  input?: unknown;
  /** Approval response for status badge */
  approval?: { approved?: boolean };
  /** Display context from chat component */
  displayContext?: DisplayContext;
  /** Whether to use the artifact wrapper (default: true) */
  useWrapper?: boolean;
}

/**
 * Render the appropriate view for a result type.
 */
function renderResultView(
  resultType: DisplayResultType | null,
  output: unknown,
  state: ToolState,
  toolName: string,
  input?: unknown
): ReactNode {
  switch (resultType) {
    case "success":
      return (
        <SuccessCard
          output={output as SuccessConfirmationShape}
          toolName={toolName}
        />
      );

    case "calendar":
      return <CalendarView output={output as any} state={state} />;

    case "queue":
      return <QueueView output={output as any} state={state} />;

    case "media-results":
      return (
        <MediaResultsView
          output={output as any}
          state={state}
          toolName={toolName}
        />
      );

    case "discovery":
      // Discovery uses media results view (sections are flattened)
      return (
        <MediaResultsView
          output={output as any}
          state={state}
          toolName={toolName}
        />
      );

    default:
      return <GenericResult input={input} output={output} state={state} />;
  }
}

/**
 * Main dispatcher that routes tool outputs to specialized renderers.
 *
 * IMPORTANT: This uses SHAPE DETECTION (duck typing) instead of hardcoded tool names.
 * Any tool that returns data matching a known shape will automatically get the
 * appropriate rich renderer. This makes the system extensible for plugins.
 *
 * Shape detection order:
 * 1. Check for error shape → ErrorResult
 * 2. Check for calendar shape (has `movies` or `episodes` array) → CalendarView
 * 3. Check for queue shape (has `queue` array) → QueueView
 * 4. Check for media results shape (has `results` array with media items) → MediaResultsView
 * 5. Fallback: GenericResult (JSON display)
 *
 * When useWrapper is true (default), results are wrapped in the ArtifactWrapper
 * which provides progressive disclosure with collapsible UI.
 */
export function ToolResultRenderer({
  toolName,
  output,
  state,
  input,
  approval,
  displayContext,
  useWrapper = true,
}: ToolResultRendererProps): ReactNode {
  // Only render output when available
  if (state !== "output-available") {
    return null;
  }

  // 1. Handle error outputs (no wrapper for errors)
  if (output && typeof output === "object" && "error" in output) {
    const errorOutput = output as { error: unknown; [key: string]: unknown };
    return <ErrorResult context={errorOutput} error={errorOutput.error} />;
  }

  // 2. Detect result type by shape (not tool name!)
  const resultType = detectResultType(output);

  // 3. Render the appropriate view
  const content = renderResultView(resultType, output, state, toolName, input);

  // 4. Wrap in ArtifactWrapper if enabled
  if (useWrapper) {
    return (
      <ArtifactWrapper
        approval={approval}
        displayContext={displayContext}
        output={output}
        resultType={resultType as DisplayResultType | null}
        state={state}
        toolName={toolName}
      >
        {content}
      </ArtifactWrapper>
    );
  }

  return content;
}

/**
 * Helper to check if output should use a rich renderer.
 * Uses shape detection - any output matching a known shape gets rich rendering.
 */
export function hasRichRenderer(output: unknown): boolean {
  return detectResultType(output) !== null;
}
