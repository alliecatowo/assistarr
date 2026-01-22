"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { LoaderIcon, SendIcon, SparklesIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  isMediaResultsShape,
  isRecommendationShape,
  type MediaItemShape,
  type RecommendationItem,
} from "@/components/tool-results/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { type DiscoverItem, useDiscover } from "./discover-context";

/** Convert a RecommendationItem to a DiscoverItem */
function mapRecommendationToDiscover(rec: RecommendationItem): DiscoverItem {
  return {
    id: rec.tmdbId,
    title: rec.title,
    year: rec.year,
    posterUrl: rec.posterUrl,
    rating: rec.rating,
    mediaType: rec.mediaType,
    tmdbId: rec.tmdbId,
    status: "unavailable",
    reason: rec.reason,
  };
}

/** Convert a MediaItemShape to a DiscoverItem */
function mapMediaItemToDiscover(item: MediaItemShape): DiscoverItem {
  const tmdbId = item.tmdbId ?? item.externalIds?.tmdb;

  // Map status from DisplayableMedia format to DiscoverItem format
  let status: DiscoverItem["status"] = "unavailable";
  if (item.status === "available") {
    status = "available";
  } else if (
    item.status === "requested" ||
    item.status === "downloading" ||
    item.status === "wanted"
  ) {
    status = "pending";
  } else if (item.isAvailable) {
    // Legacy fallback
    status = "available";
  } else if (item.isPending) {
    // Legacy fallback
    status = "pending";
  }

  return {
    id: item.id ?? tmdbId ?? 0,
    title: item.title,
    year: item.year,
    posterUrl: item.posterUrl ?? item.imageUrl,
    rating: item.rating,
    mediaType: (item.mediaType as "movie" | "tv") ?? "movie",
    tmdbId,
    status,
    reason: undefined,
  };
}

/** Extract tool results from message parts */
function extractToolResults(parts: ChatMessage["parts"]): {
  aiIntro: string;
  toolResults: unknown[];
} {
  let aiIntro = "";
  const toolResults: unknown[] = [];

  for (const part of parts ?? []) {
    if (part.type === "text") {
      aiIntro += part.text;
    } else if (part.type.startsWith("tool-")) {
      const toolPart = part as unknown as { state: string; output?: unknown };
      if (toolPart.state === "output-available" && toolPart.output) {
        toolResults.push(toolPart.output);
      }
    }
  }

  return { aiIntro, toolResults };
}

interface DiscoverChatBarProps {
  userId: string;
}

export function DiscoverChatBar({ userId: _userId }: DiscoverChatBarProps) {
  const [input, setInput] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showAIResults, setLoading, isLoading, registerSubmitHandler } =
    useDiscover();

  // Generate a stable chat ID for this discover session
  // Use a lazy initialization to ensure the same UUID across SSR and hydration
  const [chatId] = useState(() => generateUUID());

  // Memoize the transport to avoid recreating it on every render
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest(request) {
        const lastMessage = request.messages.at(-1);
        return {
          body: {
            id: chatId,
            message: lastMessage,
            selectedChatModel: "google/gemini-2.5-flash",
            selectedVisibilityType: "private",
            mode: "discover",
          },
        };
      },
    });
  }, [chatId]);

  const {
    sendMessage,
    status,
    messages,
    error,
  } = useChat<ChatMessage>({
    id: chatId,
    generateId: generateUUID,
    transport,
  });

  // Show error toast when chat errors occur
  useEffect(() => {
    if (error) {
      setLoading(false);
      toast({
        type: "error",
        description: error.message || "Failed to get recommendations. Please try again.",
      });
    }
  }, [error, setLoading]);

  // Process AI responses and extract recommendations
  useEffect(() => {
    const lastMessage = messages.at(-1);
    if (lastMessage?.role !== "assistant") {
      return;
    }

    const { aiIntro, toolResults } = extractToolResults(lastMessage.parts);

    // Process tool results - prefer RecommendationShape (has reasons)
    for (const result of toolResults) {
      if (isRecommendationShape(result)) {
        showAIResults({
          query: lastQuery,
          intro: result.introduction || aiIntro.trim(),
          items: result.recommendations.map(mapRecommendationToDiscover),
          refineOptions: [
            "More like this",
            "Something different",
            "Newer",
            "Classics",
          ],
        });
        return;
      }

      if (isMediaResultsShape(result)) {
        showAIResults({
          query: lastQuery,
          intro: aiIntro.trim() || result.message || "",
          items: result.results.map(mapMediaItemToDiscover),
        });
        return;
      }
    }
  }, [messages, showAIResults, lastQuery]);

  // Update loading state based on chat status
  useEffect(() => {
    setLoading(status === "streaming" || status === "submitted");
  }, [status, setLoading]);

  const submitQuery = useCallback(
    (query: string) => {
      if (!query.trim() || status === "streaming") {
        return;
      }

      setLastQuery(query);
      setLoading(true);
      sendMessage({
        role: "user",
        parts: [{ type: "text", text: query.trim() }],
      });
      setInput("");
    },
    [status, sendMessage, setLoading]
  );

  // Register the submit handler with context so quick actions can use it
  useEffect(() => {
    registerSubmitHandler(submitQuery);
  }, [registerSubmitHandler, submitQuery]);

  const handleSubmit = useCallback(() => {
    submitQuery(input);
  }, [input, submitQuery]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm p-4 shadow-lg transition-all duration-200">
      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <div className="relative flex-1">
          <SparklesIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Textarea
            className="min-h-[48px] max-h-32 resize-none pl-10 pr-4"
            disabled={isLoading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you're in the mood for..."
            ref={textareaRef}
            rows={1}
            value={input}
          />
        </div>
        <Button
          className="h-12 w-12"
          disabled={!input.trim() || isLoading}
          onClick={handleSubmit}
          size="icon"
        >
          {isLoading ? (
            <LoaderIcon className="size-5 animate-spin" />
          ) : (
            <SendIcon className="size-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
