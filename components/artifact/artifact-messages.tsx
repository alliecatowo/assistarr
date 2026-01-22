import { AnimatePresence, motion } from "framer-motion";
import { memo } from "react";
import type { UIArtifact } from "@/components/artifact/artifact";
import { useChatContext } from "@/components/chat/chat-context";
import { PreviewMessage, ThinkingMessage } from "@/components/chat/message";
import { useMessages } from "@/hooks/use-messages";

type ArtifactMessagesProps = {
  artifactStatus: UIArtifact["status"];
};

function PureArtifactMessages({ artifactStatus: _ }: ArtifactMessagesProps) {
  const {
    addToolApprovalResponse,
    chatId,
    status,
    votes,
    messages,
    setMessages,
    regenerate,
    isReadonly,
  } = useChatContext();
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  } = useMessages({
    status,
  });

  return (
    <div
      className="flex h-full flex-col items-center gap-4 overflow-y-scroll px-4 pt-20"
      ref={messagesContainerRef}
    >
      {messages.map((message, index) => (
        <PreviewMessage
          addToolApprovalResponse={addToolApprovalResponse}
          chatId={chatId}
          isLoading={status === "streaming" && index === messages.length - 1}
          isReadonly={isReadonly}
          key={message.id}
          message={message}
          regenerate={regenerate}
          requiresScrollPadding={
            hasSentMessage && index === messages.length - 1
          }
          setMessages={setMessages}
          vote={
            votes
              ? votes.find((vote) => vote.messageId === message.id)
              : undefined
          }
        />
      ))}

      <AnimatePresence mode="wait">
        {status === "submitted" &&
          !messages.some((msg) =>
            msg.parts?.some(
              (part) => "state" in part && part.state === "approval-responded"
            )
          ) && <ThinkingMessage key="thinking" />}
      </AnimatePresence>

      <motion.div
        className="min-h-[24px] min-w-[24px] shrink-0"
        onViewportEnter={onViewportEnter}
        onViewportLeave={onViewportLeave}
        ref={messagesEndRef}
      />
    </div>
  );
}

// With context, most state comes from context
// Only compare the artifactStatus prop that's still passed directly
function areEqual(
  prevProps: ArtifactMessagesProps,
  nextProps: ArtifactMessagesProps
) {
  // Skip updates while artifact is streaming to avoid performance issues
  if (
    prevProps.artifactStatus === "streaming" &&
    nextProps.artifactStatus === "streaming"
  ) {
    return true;
  }

  return prevProps.artifactStatus === nextProps.artifactStatus;
}

export const ArtifactMessages = memo(PureArtifactMessages, areEqual);
