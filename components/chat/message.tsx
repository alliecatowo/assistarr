"use client";
import type { UseChatHelpers } from "@ai-sdk/react";
import { type Dispatch, type SetStateAction, useState } from "react";
import { PlasmaOrb, StreamingIndicator } from "@/components/ai-loading";
import { DocumentToolResult } from "@/components/artifact/document";
import { DocumentPreview } from "@/components/artifact/document-preview";
import { MessageEditor } from "@/components/artifact/message-editor";
import { MessageContent } from "@/components/elements/message";
import { PreviewAttachment } from "@/components/elements/preview-attachment";
import { Response } from "@/components/elements/response";
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
import type { Vote } from "@/lib/db/schema";
import { getToolDisplayName } from "@/lib/plugins/registry";
import type { ChatMessage } from "@/lib/types";
import { cn, sanitizeText } from "@/lib/utils";
import { useDataStream } from "./data-stream-provider";
import { MessageActions } from "./message-actions";
import { MessageReasoning } from "./message-reasoning";

interface MessagePartProps {
  part: ChatMessage["parts"][number];
  index: number;
  message: ChatMessage;
  isLoading: boolean;
  isReadonly: boolean;
  mode: "view" | "edit";
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  setMode: Dispatch<SetStateAction<"view" | "edit">>;
}

const MessagePartReasoning = ({
  part,
  isLoading,
  partKey,
}: {
  part: Extract<ChatMessage["parts"][number], { type: "reasoning" }>;
  isLoading: boolean;
  partKey: string;
}) => {
  const hasContent = part.text?.trim().length > 0;
  const isStreaming = "state" in part && part.state === "streaming";
  if (hasContent || isStreaming) {
    return (
      <MessageReasoning
        isLoading={isLoading || isStreaming}
        key={partKey}
        reasoning={part.text || ""}
      />
    );
  }
  return null;
};

const MessagePartText = ({
  part,
  message,
  mode,
  regenerate,
  setMessages,
  setMode,
  partKey,
}: {
  part: Extract<ChatMessage["parts"][number], { type: "text" }>;
  message: ChatMessage;
  mode: "view" | "edit";
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  setMode: Dispatch<SetStateAction<"view" | "edit">>;
  partKey: string;
}) => {
  if (!part.text?.trim()) {
    return null;
  }

  if (mode === "view") {
    return (
      <div key={partKey}>
        <MessageContent
          className={cn({
            "wrap-break-word w-fit rounded-2xl px-3 py-2 text-right text-white":
              message.role === "user",
            "bg-transparent px-0 py-0 text-left": message.role === "assistant",
          })}
          data-testid="message-content"
          style={
            message.role === "user" ? { backgroundColor: "#006cff" } : undefined
          }
        >
          <Response>{sanitizeText(part.text)}</Response>
        </MessageContent>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-row items-start gap-3" key={partKey}>
      <div className="size-8" />
      <div className="min-w-0 flex-1">
        <MessageEditor
          key={message.id}
          message={message}
          regenerate={regenerate}
          setMessages={setMessages}
          setMode={setMode}
        />
      </div>
    </div>
  );
};

const MessagePartDocument = ({
  part,
  isReadonly,
}: {
  part: Extract<
    ChatMessage["parts"][number],
    {
      type:
        | "tool-createDocument"
        | "tool-updateDocument"
        | "tool-requestSuggestions";
    }
  >;
  isReadonly: boolean;
}) => {
  const { type, toolCallId } = part;

  if (type === "tool-createDocument") {
    if (part.output && "error" in part.output) {
      return (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
          key={toolCallId}
        >
          Error creating document: {String(part.output.error)}
        </div>
      );
    }
    return (
      <DocumentPreview
        isReadonly={isReadonly}
        key={toolCallId}
        result={part.output}
      />
    );
  }

  if (type === "tool-updateDocument") {
    if (part.output && "error" in part.output) {
      return (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500 dark:bg-red-950/50"
          key={toolCallId}
        >
          Error updating document: {String(part.output.error)}
        </div>
      );
    }
    return (
      <div className="relative" key={toolCallId}>
        <DocumentPreview
          args={{ ...part.output, isUpdate: true }}
          isReadonly={isReadonly}
          result={part.output}
        />
      </div>
    );
  }

  if (type === "tool-requestSuggestions") {
    const { state } = part;
    return (
      <Tool defaultOpen={true} key={toolCallId}>
        <ToolHeader state={state} type="tool-requestSuggestions" />
        <ToolContent>
          {state === "input-available" && <ToolInput input={part.input} />}
          {state === "output-available" && (
            <ToolOutput
              errorText={undefined}
              output={
                "error" in part.output ? (
                  <div className="rounded border p-2 text-red-500">
                    Error: {String(part.output.error)}
                  </div>
                ) : (
                  <DocumentToolResult
                    isReadonly={isReadonly}
                    result={part.output}
                    type="request-suggestions"
                  />
                )
              }
            />
          )}
        </ToolContent>
      </Tool>
    );
  }

  return null;
};

const MessagePartGenericTool = ({
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
            errorText={undefined}
            output={
              <ToolResultRenderer
                input={toolPart.input}
                output={toolPart.output}
                state={state}
                toolName={rawToolName}
                useWrapper={false}
              />
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

const MessagePart = ({
  part,
  index,
  message,
  isLoading,
  isReadonly,
  mode,
  addToolApprovalResponse,
  regenerate,
  setMessages,
  setMode,
}: MessagePartProps) => {
  const { type } = part;
  const key = `message-${message.id}-part-${index}`;

  if (type === "reasoning") {
    return (
      <MessagePartReasoning isLoading={isLoading} part={part} partKey={key} />
    );
  }

  if (type === "text") {
    return (
      <MessagePartText
        message={message}
        mode={mode}
        part={part}
        partKey={key}
        regenerate={regenerate}
        setMessages={setMessages}
        setMode={setMode}
      />
    );
  }

  if (
    type === "tool-createDocument" ||
    type === "tool-updateDocument" ||
    type === "tool-requestSuggestions"
  ) {
    return <MessagePartDocument isReadonly={isReadonly} part={part} />;
  }

  if (type.startsWith("tool-")) {
    return (
      <MessagePartGenericTool
        addToolApprovalResponse={addToolApprovalResponse}
        part={
          part as unknown as Extract<
            ChatMessage["parts"][number],
            { type: `tool-${string}` }
          >
        }
      />
    );
  }

  return null;
};

const PurePreviewMessage = ({
  addToolApprovalResponse,
  chatId,
  message,
  vote,
  isLoading,
  setMessages,
  regenerate,
  isReadonly,
  requiresScrollPadding: _requiresScrollPadding,
}: {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];
  chatId: string;
  message: ChatMessage;
  vote: Vote | undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<"view" | "edit">("view");

  const attachmentsFromMessage = message.parts.filter(
    (part) => part.type === "file"
  );

  useDataStream();

  return (
    <div
      className="group/message fade-in w-full animate-in duration-200"
      data-role={message.role}
      data-testid={`message-${message.role}`}
    >
      <div
        className={cn("flex w-full items-start gap-2 md:gap-3", {
          "justify-end": message.role === "user" && mode !== "edit",
          "justify-start": message.role === "assistant",
        })}
      >
        {message.role === "assistant" && (
          <div className="-mt-1 flex size-8 shrink-0 items-center justify-center">
            <PlasmaOrb size={32} />
          </div>
        )}

        <div
          className={cn("flex flex-col", {
            "gap-2 md:gap-4": message.role === "assistant",
            "w-full":
              (message.role === "assistant" &&
                (message.parts?.some(
                  (p) => p.type === "text" && p.text?.trim()
                ) ||
                  message.parts?.some((p) => p.type.startsWith("tool-")))) ||
              mode === "edit",
            "max-w-[calc(100%-2.5rem)] sm:max-w-[min(fit-content,80%)]":
              message.role === "user" && mode !== "edit",
          })}
        >
          {attachmentsFromMessage.length > 0 && (
            <div
              className="flex flex-row justify-end gap-2"
              data-testid={"message-attachments"}
            >
              {attachmentsFromMessage.map((attachment) => (
                <PreviewAttachment
                  attachment={{
                    name: attachment.filename ?? "file",
                    contentType: attachment.mediaType,
                    url: attachment.url,
                  }}
                  key={attachment.url}
                />
              ))}
            </div>
          )}

          {message.parts?.map((part, index) => (
            <MessagePart
              addToolApprovalResponse={addToolApprovalResponse}
              index={index}
              isLoading={isLoading}
              isReadonly={isReadonly}
              key={`part-${message.id}-${index}`}
              message={message}
              mode={mode}
              part={part}
              regenerate={regenerate}
              setMessages={setMessages}
              setMode={setMode}
            />
          ))}

          {isLoading &&
            message.role === "assistant" &&
            message.parts?.some(
              (part) =>
                (part.type === "text" && part.text?.trim()) ||
                (part.type === "reasoning" && part.text?.trim()) ||
                part.type.startsWith("tool-")
            ) && (
              <div className="flex items-center text-muted-foreground">
                <StreamingIndicator />
              </div>
            )}

          {!isReadonly && (
            <MessageActions
              chatId={chatId}
              isLoading={
                isLoading ||
                message.parts?.some(
                  (part) =>
                    "state" in part && part.state === "approval-requested"
                )
              }
              key={`action-${message.id}`}
              message={message}
              setMode={setMode}
              vote={vote}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const PreviewMessage = PurePreviewMessage;

export const ThinkingMessage = () => {
  return (
    <div
      className="group/message fade-in w-full animate-in duration-300"
      data-role="assistant"
      data-testid="message-assistant-loading"
    >
      <div className="flex items-start justify-start gap-2 md:gap-3">
        <div className="-mt-1 flex size-8 shrink-0 items-center justify-center">
          <PlasmaOrb size={32} />
        </div>

        <div className="flex w-full flex-col gap-2 md:gap-4">
          <div className="flex items-center text-muted-foreground">
            <StreamingIndicator />
          </div>
        </div>
      </div>
    </div>
  );
};
