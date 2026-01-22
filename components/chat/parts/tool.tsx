import type { UseChatHelpers } from "@ai-sdk/react";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/elements/tool";
import {
  DEFAULT_DISPLAY_CONTEXT,
  type DisplayContext,
  hasRichRenderer,
  SimpleArtifactWrapper,
  ToolResultRenderer,
} from "@/components/tool-results";
import {
  ApprovalCard,
  shouldUseApprovalCard,
} from "@/components/tool-results/approval-card";
import { getToolDisplayName } from "@/lib/plugins/registry";
import type { ChatMessage } from "@/lib/types";

export const MessagePartGenericTool = ({
  part,
  addToolApprovalResponse,
}: {
  part: Extract<ChatMessage["parts"][number], { type: `tool-${string}` }>;
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
}) => {
  const toolPart = part as unknown as {
    toolCallId: string;
    state: string;
    input: { metadata?: Record<string, unknown> };
    output?: Record<string, unknown>;
    approval?: { id: string; approved?: boolean };
  };
  const { toolCallId, state, type } = part;
  const rawToolName = type.replace("tool-", "");
  const displayName = getToolDisplayName(rawToolName);

  const hasError =
    state === "output-available" &&
    toolPart.output &&
    typeof toolPart.output === "object" &&
    "error" in toolPart.output;
  const displayState = hasError ? "output-error" : state;

  const isApprovalRequested = state === "approval-requested";
  const approvalId = toolPart.approval?.id;

  const displayContext: DisplayContext = {
    ...DEFAULT_DISPLAY_CONTEXT,
    isLatestMessage: true,
  };

  const isRichResult =
    state === "output-available" &&
    hasRichRenderer(toolPart.output) &&
    !hasError;

  if (isApprovalRequested && approvalId) {
    if (shouldUseApprovalCard(rawToolName)) {
      return (
        <div key={toolCallId}>
          <ApprovalCard
            input={toolPart.input}
            // biome-ignore lint/suspicious/noExplicitAny: Generic metadata match
            metadata={toolPart.input?.metadata as any}
            onApprove={() => {
              addToolApprovalResponse({
                id: approvalId,
                approved: true,
              });
            }}
            onDeny={() => {
              addToolApprovalResponse({
                id: approvalId,
                approved: false,
                reason: "User denied this action",
              });
            }}
            toolName={rawToolName}
          />
        </div>
      );
    }
    return (
      <div
        className="max-w-[min(100%,450px)] rounded-md border-2 border-yellow-500/50 bg-yellow-500/5"
        key={toolCallId}
      >
        <Tool className="w-full border-0" defaultOpen={true}>
          <ToolHeader
            approval={toolPart.approval}
            state={displayState}
            type={displayName}
          />
          <ToolContent>
            <ToolInput input={toolPart.input} />
          </ToolContent>
        </Tool>
        <div className="flex items-center justify-end gap-3 border-t border-yellow-500/30 bg-yellow-500/5 px-4 py-3">
          <button
            className="rounded-md px-4 py-2 text-muted-foreground text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => {
              addToolApprovalResponse({
                id: approvalId,
                approved: false,
                reason: "User denied this action",
              });
            }}
            type="button"
          >
            Deny Request
          </button>
          <button
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90"
            onClick={() => {
              addToolApprovalResponse({
                id: approvalId,
                approved: true,
              });
            }}
            type="button"
          >
            Allow Request
          </button>
        </div>
      </div>
    );
  }

  if (isRichResult) {
    return (
      <ToolResultRenderer
        approval={toolPart.approval}
        displayContext={displayContext}
        input={toolPart.input}
        key={toolCallId}
        output={toolPart.output}
        state={state}
        toolName={displayName}
        useWrapper={true}
      />
    );
  }

  return (
    <div className="max-w-[min(100%,450px)]" key={toolCallId}>
      <SimpleArtifactWrapper
        approval={toolPart.approval}
        defaultOpen={false}
        state={displayState}
        toolName={displayName}
      >
        {state === "input-available" && <ToolInput input={toolPart.input} />}

        {state === "output-available" && (
          <ToolOutput
            errorText={
              hasError && toolPart.output
                ? String((toolPart.output as { error: unknown }).error)
                : undefined
            }
            output={
              !hasError && (
                <ToolResultRenderer
                  input={toolPart.input}
                  output={toolPart.output}
                  state={state}
                  toolName={rawToolName}
                  useWrapper={false}
                />
              )
            }
          />
        )}

        {state === "output-denied" && (
          <div className="px-4 py-2 text-xs text-red-500">
            Tool execution denied.
          </div>
        )}
      </SimpleArtifactWrapper>
    </div>
  );
};
