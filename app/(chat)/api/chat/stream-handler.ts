import type { Geo } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  stepCountIs,
  streamText,
} from "ai";
import type { Session } from "next-auth";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getLanguageModel } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { recommendMedia } from "@/lib/ai/tools/recommend-media";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { isProductionEnvironment } from "@/lib/constants";
import { updateChatTitleById } from "@/lib/db/queries/index";
import type { ServiceConfig, UserAIConfig } from "@/lib/db/schema";
import { pluginManager } from "@/lib/plugins/registry";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { type PersistContext, persistMessages } from "./message-persistence";

export type StreamConfig = {
  chatId: string;
  session: Session;
  selectedChatModel: string;
  uiMessages: ChatMessage[];
  configsMap: Map<string, ServiceConfig>;
  requestHints: RequestHints;
  debugMode: boolean;
  mode: "chat" | "discover";
  isToolApprovalFlow: boolean;
  titlePromise: Promise<string> | null;
  userAIConfig?: UserAIConfig | null;
};

/**
 * Convert service configs array to a Map for efficient lookup
 */
export function configsToMap(
  configs: ServiceConfig[]
): Map<string, ServiceConfig> {
  const map = new Map<string, ServiceConfig>();
  for (const config of configs) {
    map.set(config.serviceName, config);
  }
  return map;
}

/**
 * Build request hints from geolocation data
 */
export function buildRequestHints(geo: Partial<Geo>): RequestHints {
  return {
    longitude: geo.longitude,
    latitude: geo.latitude,
    city: geo.city,
    country: geo.country,
  };
}

/**
 * Creates the chat stream with all tools configured.
 * If userAIConfig is provided, uses the user's own API key.
 */
export function createChatStream(config: StreamConfig) {
  const {
    chatId,
    session,
    selectedChatModel,
    uiMessages,
    configsMap,
    requestHints,
    debugMode,
    mode,
    isToolApprovalFlow,
    titlePromise,
    userAIConfig,
  } = config;

  const isReasoningModel =
    selectedChatModel.includes("reasoning") ||
    selectedChatModel.includes("thinking");

  return createUIMessageStream({
    originalMessages: isToolApprovalFlow ? uiMessages : undefined,
    execute: async ({ writer: dataStream }) => {
      // Initialize tools with dataStream
      const baseTools = {
        createDocument: createDocument({ session, dataStream }),
        updateDocument: updateDocument({ session, dataStream }),
        requestSuggestions: requestSuggestions({ session, dataStream }),
        recommendMedia: recommendMedia(),
      };

      // Dynamically load service tools based on config
      const serviceTools = pluginManager.getToolsForSession(
        session,
        configsMap,
        mode
      );

      const effectiveTools = {
        ...baseTools,
        ...serviceTools,
      };

      const modelMessages = await convertToModelMessages(uiMessages);

      // Get language model - uses user's API key if configured
      const model = getLanguageModel(
        selectedChatModel,
        userAIConfig ?? undefined
      );

      const result = streamText({
        model,
        system: systemPrompt({
          selectedChatModel,
          requestHints,
          debugMode,
          mode,
        }),
        messages: modelMessages,
        stopWhen: stepCountIs(8),
        experimental_activeTools: Object.keys(effectiveTools) as Array<
          keyof typeof effectiveTools
        >,
        providerOptions: {
          ...(isReasoningModel && selectedChatModel.includes("claude")
            ? {
                anthropic: {
                  thinking: { type: "enabled", budgetTokens: 10_000 },
                },
              }
            : {}),
          ...(selectedChatModel.includes("gemini")
            ? {
                google: selectedChatModel.includes("gemini-3")
                  ? {
                      thinkingConfig: {
                        thinkingLevel: "high",
                        includeThoughts: true,
                      },
                    }
                  : {
                      thinkingConfig: {
                        thinkingBudget: 8192,
                        includeThoughts: true,
                      },
                    },
              }
            : {}),
        },
        tools: effectiveTools,
        experimental_telemetry: {
          isEnabled: isProductionEnvironment,
          functionId: "stream-text",
        },
      });

      dataStream.merge(result.toUIMessageStream({ sendReasoning: true }));

      if (titlePromise) {
        const title = await titlePromise;
        dataStream.write({ type: "data-chat-title", data: title });
        await updateChatTitleById({ chatId, title });
      }
    },
    generateId: generateUUID,
    onFinish: async ({ messages: finishedMessages }) => {
      const persistContext: PersistContext = {
        chatId,
        isToolApprovalFlow,
        originalMessages: uiMessages,
      };
      await persistMessages(finishedMessages, persistContext);
    },
    onError: () => "Oops, an error occurred!",
  });
}
