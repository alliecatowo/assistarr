"use client";
import type { UseChatHelpers } from "@ai-sdk/react";
import { type Dispatch, type SetStateAction, useState } from "react";
import { PlasmaOrb, StreamingIndicator } from "@/components/ai-loading";
import { PreviewAttachment } from "@/components/elements/preview-attachment";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDataStream } from "./data-stream-provider";
import { MessageActions } from "./message-actions";

import { MessagePartDocument } from "./parts/document";
import { MessagePartReasoning } from "./parts/reasoning";
import { MessagePartText } from "./parts/text";
import { MessagePartGenericTool } from "./parts/tool";

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
