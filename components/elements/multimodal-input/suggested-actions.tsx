"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo, useMemo } from "react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "../suggestion";
import type { VisibilityType } from "../visibility-selector";

/**
 * Media server suggestions organized by category.
 * These are relevant to home media server management with Radarr, Sonarr, Jellyfin, etc.
 */
const MEDIA_SERVER_SUGGESTIONS = {
  discovery: [
    "What's trending this week?",
    "Show me popular comedies from 2024",
    "What new shows are releasing soon?",
    "What sci-fi movies came out this year?",
  ],
  management: [
    "What's in my download queue?",
    "Are there any stalled downloads?",
    "Check for import issues",
    "Show me my recent downloads",
  ],
  library: [
    "What movies do I have?",
    "Search for The Sopranos",
    "Show my TV library",
    "Find movies with Tom Hanks",
  ],
  calendar: [
    "What movies are releasing this month?",
    "Show my upcoming episodes",
    "What's airing today?",
    "When does the next season of my shows start?",
  ],
};

/**
 * Pick a random item from an array.
 */
function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Get media server suggestions - one from each category.
 */
function getMediaServerSuggestions(): string[] {
  return [
    pickRandom(MEDIA_SERVER_SUGGESTIONS.discovery),
    pickRandom(MEDIA_SERVER_SUGGESTIONS.management),
    pickRandom(MEDIA_SERVER_SUGGESTIONS.library),
    pickRandom(MEDIA_SERVER_SUGGESTIONS.calendar),
  ];
}

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  // Memoize suggestions so they don't change on every render
  const suggestedActions = useMemo(() => getMediaServerSuggestions(), []);

  return (
    <div
      className="grid w-full gap-2 sm:grid-cols-2"
      data-testid="suggested-actions"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          initial={{ opacity: 0, y: 20 }}
          key={suggestedAction}
          transition={{ delay: 0.05 * index }}
        >
          <Suggestion
            className="h-auto w-full whitespace-normal p-3 text-left"
            onClick={(suggestion) => {
              window.history.pushState({}, "", `/chat/${chatId}`);
              sendMessage({
                role: "user",
                parts: [{ type: "text", text: suggestion }],
              });
            }}
            suggestion={suggestedAction}
          >
            {suggestedAction}
          </Suggestion>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);
