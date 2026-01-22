import type { ChatMessage } from "@/lib/types";
import { MessageReasoning } from "../message-reasoning";

export const MessagePartReasoning = ({
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
