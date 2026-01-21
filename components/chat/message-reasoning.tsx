"use client";

import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/elements/reasoning";

type MessageReasoningProps = {
  isLoading: boolean;
  reasoning: string;
};

/**
 * MessageReasoning displays the AI's reasoning/thinking process.
 * - Collapsed by default for historical messages
 * - Opens only while actively streaming
 * - Auto-closes after streaming completes
 */
export function MessageReasoning({
  isLoading,
  reasoning,
}: MessageReasoningProps) {
  // Only open by default if actively streaming
  // Historical messages (isLoading=false) will be collapsed
  return (
    <Reasoning
      data-testid="message-reasoning"
      defaultOpen={isLoading}
      isStreaming={isLoading}
    >
      <ReasoningTrigger />
      <ReasoningContent>{reasoning}</ReasoningContent>
    </Reasoning>
  );
}
