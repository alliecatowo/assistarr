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
import { getEnabledMCPConfigs, updateChatTitleById } from "@/lib/db/queries/index";
import type { MCPServerConfig, ServiceConfig, UserAIConfig } from "@/lib/db/schema";
import { createLogger } from "@/lib/logger";
import {
  type MCPClientWrapper,
  createMCPClientWrapper,
  mergeMCPToolsWithBase,
} from "@/lib/mcp";
import { pluginManager } from "@/lib/plugins/registry";
import type { InjectedSkill } from "@/lib/skills";
import type { ChatMessage } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { type PersistContext, persistMessages } from "./message-persistence";

const log = createLogger("chat:stream-handler");

export type StreamConfig = {
  chatId: string;
  session: Session;
  selectedChatModel: string;
  uiMessages: ChatMessage[];
  configsMap: Map<string, ServiceConfig>;
  mcpConfigs?: MCPServerConfig[];
  skills?: InjectedSkill[];
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
    mcpConfigs = [],
    skills = [],
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

  // Track MCP clients for cleanup
  const mcpClients: MCPClientWrapper[] = [];

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

      let effectiveTools = {
        ...baseTools,
        ...serviceTools,
      };

      // Initialize MCP clients and merge their tools
      if (mcpConfigs.length > 0) {
        log.debug(
          { mcpServerCount: mcpConfigs.length },
          "Initializing MCP clients"
        );

        const mcpWrappers: Array<{
          wrapper: MCPClientWrapper;
          displayName: string;
        }> = [];

        for (const mcpConfig of mcpConfigs) {
          try {
            const wrapper = await createMCPClientWrapper({
              url: mcpConfig.url,
              transport: mcpConfig.transport,
              apiKey: mcpConfig.apiKey,
              headers: mcpConfig.headers ?? undefined,
            });
            mcpClients.push(wrapper);
            mcpWrappers.push({ wrapper, displayName: mcpConfig.name });
            log.debug(
              { serverName: mcpConfig.name, url: mcpConfig.url },
              "MCP client initialized"
            );
          } catch (error) {
            log.error(
              { error, serverName: mcpConfig.name },
              "Failed to initialize MCP client"
            );
          }
        }

        if (mcpWrappers.length > 0) {
          const { tools: mergedTools, mcpToolCount } =
            await mergeMCPToolsWithBase(effectiveTools, mcpWrappers);
          effectiveTools = mergedTools;
          log.info(
            { mcpToolCount, totalToolCount: Object.keys(mergedTools).length },
            "Merged MCP tools"
          );
        }
      }

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
          skills,
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
      // Clean up MCP clients
      for (const client of mcpClients) {
        try {
          await client.close();
        } catch (error) {
          log.error({ error }, "Failed to close MCP client");
        }
      }

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
