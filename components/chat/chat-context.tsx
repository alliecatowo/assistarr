"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
} from "react";
import type { VisibilityType } from "@/components/elements/visibility-selector";
import type { Vote } from "@/lib/db/schema";
import type { Attachment, ChatMessage } from "@/lib/types";

export type ChatContextValue = {
  // Chat identification
  chatId: string;
  isReadonly: boolean;

  // Messages state
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];

  // Chat status and controls
  status: UseChatHelpers<ChatMessage>["status"];
  stop: UseChatHelpers<ChatMessage>["stop"];
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  addToolApprovalResponse: UseChatHelpers<ChatMessage>["addToolApprovalResponse"];

  // Input state
  input: string;
  setInput: Dispatch<SetStateAction<string>>;

  // Attachments state
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;

  // Model and visibility settings
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  selectedVisibilityType: VisibilityType;

  // Debug mode
  debugMode: boolean;
  onDebugModeChange: (enabled: boolean) => void;

  // Votes
  votes: Vote[] | undefined;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export type ChatProviderProps = {
  children: ReactNode;
  value: ChatContextValue;
};

export function ChatProvider({ children, value }: ChatProviderProps) {
  // Note: Memoization should be done at the parent component level where the
  // value object is created, not here where it's consumed. The parent is
  // responsible for ensuring the value object reference is stable across renders.
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}

/**
 * Optional hook that returns undefined if not within a ChatProvider.
 * Useful for components that may or may not be rendered within the chat context.
 */
export function useChatContextOptional(): ChatContextValue | null {
  return useContext(ChatContext);
}
