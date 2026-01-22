import type { UseChatHelpers } from "@ai-sdk/react";
import type { Dispatch, SetStateAction } from "react";
import { MessageEditor } from "@/components/artifact/message-editor";
import { MessageContent } from "@/components/elements/message";
import { Response } from "@/components/elements/response";
import type { ChatMessage } from "@/lib/types";
import { cn, sanitizeText } from "@/lib/utils";

export const MessagePartText = ({
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
