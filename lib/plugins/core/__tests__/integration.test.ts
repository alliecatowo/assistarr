/**
 * Integration tests for the Plugin System
 *
 * These tests verify the full flow of:
 * 1. Plugin registration
 * 2. Tool instantiation with session/config context
 * 3. Tool execution with mocked external API calls
 */
import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { ServiceConfig } from "@/lib/db/schema";
import { PluginManager } from "../manager";
import type { ServicePlugin, ToolCategory, ToolFactoryProps } from "../types";

// Mock the logger to avoid console noise during tests
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

describe("Plugin System Integration", () => {
  // Test fixtures
  const mockSession: Session = {
    user: {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      type: "regular",
    } as any,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  const createMockConfig = (
    serviceName: string,
    overrides: Partial<ServiceConfig> = {}
  ): ServiceConfig => ({
    id: `config-${serviceName}`,
    userId: "user-123",
    serviceName,
    baseUrl: `http://${serviceName}:8080`,
    apiKey: `${serviceName}-api-key`,
    isEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  // Helper to create a fresh manager instance for each test
  const createFreshManager = (): PluginManager => {
    const manager = Object.create(PluginManager.prototype);
    Object.defineProperty(manager, "services", {
      value: new Map(),
      writable: true,
      enumerable: true,
      configurable: true,
    });
    return manager;
  };

  let manager: PluginManager;

  beforeEach(() => {
    manager = createFreshManager();
  });

  describe("Full Plugin Registration Flow", () => {
    it("should register a plugin and make its tools available", () => {
      // Create a mock plugin
      const mockPlugin: ServicePlugin = {
        name: "testService",
        displayName: "Test Service",
        description: "A test service for integration testing",
        iconId: "test",
        tools: {
          testTool: {
            factory: ({ session, config }: ToolFactoryProps) => ({
              description: "A test tool",
              parameters: z.object({ query: z.string() }),
              execute: async ({ query }) => ({
                result: `Executed with query: ${query}`,
                userId: session.user?.id,
                serviceUrl: config.baseUrl,
              }),
            }),
            displayName: "Test Tool",
            description: "A tool for testing",
            category: "search" as ToolCategory,
            modes: ["chat"],
          },
        },
        healthCheck: async () => true,
      };

      // Register the plugin
      manager.register(mockPlugin);

      // Verify registration
      const registeredPlugin = manager.getService("testService");
      expect(registeredPlugin).toBeDefined();
      expect(registeredPlugin?.name).toBe("testService");
      expect(registeredPlugin?.tools).toHaveProperty("testTool");
    });

    it("should instantiate tools with correct session and config context", () => {
      // Track factory calls
      const factorySpy = vi.fn();

      const mockPlugin: ServicePlugin = {
        name: "contextTestService",
        displayName: "Context Test Service",
        description: "Tests context passing",
        iconId: "test",
        tools: {
          contextTool: {
            factory: (props: ToolFactoryProps) => {
              factorySpy(props);
              return {
                description: "Tool that uses context",
                parameters: z.object({}),
                execute: async () => ({
                  userId: props.session.user?.id,
                  serviceUrl: props.config.baseUrl,
                }),
              };
            },
            displayName: "Context Tool",
            description: "Tests context",
            category: "search" as ToolCategory,
            modes: ["chat"],
          },
        },
        healthCheck: async () => true,
      };

      manager.register(mockPlugin);

      const config = createMockConfig("contextTestService");
      const configs = new Map<string, ServiceConfig>();
      configs.set("contextTestService", config);

      // Get tools for session
      const tools = manager.getToolsForSession(mockSession, configs, "chat");

      // Verify factory was called with correct context
      expect(factorySpy).toHaveBeenCalledWith({
        session: mockSession,
        config,
      });

      // Verify tool was created
      expect(tools).toHaveProperty("contextTool");
    });
  });

  describe("Tool Execution with Mocked External APIs", () => {
    it("should execute a tool and return results", async () => {
      // Mock external API
      const mockApiCall = vi.fn().mockResolvedValue({
        results: [{ id: 1, title: "Test Movie" }],
      });

      const mockPlugin: ServicePlugin = {
        name: "movieService",
        displayName: "Movie Service",
        description: "Search for movies",
        iconId: "movie",
        tools: {
          searchMovies: {
            factory: ({ config }: ToolFactoryProps) => ({
              description: "Search for movies",
              parameters: z.object({ query: z.string() }),
              execute: async ({ query }) => {
                // Simulate API call with config
                const response = await mockApiCall(config.baseUrl, query);
                return {
                  success: true,
                  movies: response.results,
                };
              },
            }),
            displayName: "Search Movies",
            description: "Search for movies",
            category: "search" as ToolCategory,
            modes: ["chat"],
          },
        },
        healthCheck: async () => true,
      };

      manager.register(mockPlugin);

      const config = createMockConfig("movieService");
      const configs = new Map<string, ServiceConfig>();
      configs.set("movieService", config);

      const tools = manager.getToolsForSession(mockSession, configs, "chat");

      // Execute the tool
      const result = await tools.searchMovies.execute(
        { query: "Inception" },
        {
          messages: [],
          toolCallId: "test-call-1",
          abortSignal: new AbortController().signal,
        }
      );

      // Verify API was called correctly
      expect(mockApiCall).toHaveBeenCalledWith(
        "http://movieService:8080",
        "Inception"
      );

      // Verify result
      expect(result.success).toBe(true);
      expect(result.movies).toHaveLength(1);
      expect(result.movies[0].title).toBe("Test Movie");
    });

    it("should handle API errors gracefully", async () => {
      const mockApiCall = vi
        .fn()
        .mockRejectedValue(new Error("Connection refused"));

      const mockPlugin: ServicePlugin = {
        name: "errorService",
        displayName: "Error Service",
        description: "Tests error handling",
        iconId: "error",
        tools: {
          errorTool: {
            factory: () => ({
              description: "Tool that may error",
              parameters: z.object({}),
              execute: async () => {
                try {
                  await mockApiCall();
                  return { success: true };
                } catch (error) {
                  return {
                    success: false,
                    error:
                      error instanceof Error ? error.message : "Unknown error",
                  };
                }
              },
            }),
            displayName: "Error Tool",
            description: "Tests errors",
            category: "search" as ToolCategory,
            modes: ["chat"],
          },
        },
        healthCheck: async () => true,
      };

      manager.register(mockPlugin);

      const config = createMockConfig("errorService");
      const configs = new Map<string, ServiceConfig>();
      configs.set("errorService", config);

      const tools = manager.getToolsForSession(mockSession, configs, "chat");

      const result = await tools.errorTool.execute(
        {},
        {
          messages: [],
          toolCallId: "test-call-2",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Connection refused");
    });
  });

  describe("Multi-Plugin Integration", () => {
    it("should support multiple plugins with different tools", async () => {
      // Plugin 1: Movie Service
      const moviePlugin: ServicePlugin = {
        name: "radarr",
        displayName: "Radarr",
        description: "Movie management",
        iconId: "radarr",
        tools: {
          searchMovies: {
            factory: () => ({
              description: "Search movies",
              parameters: z.object({ query: z.string() }),
              execute: async ({ query }) => ({
                type: "movie",
                query,
                results: ["Movie 1", "Movie 2"],
              }),
            }),
            displayName: "Search Movies",
            description: "Search for movies",
            category: "search" as ToolCategory,
            modes: ["chat"],
          },
        },
        healthCheck: async () => true,
      };

      // Plugin 2: TV Service
      const tvPlugin: ServicePlugin = {
        name: "sonarr",
        displayName: "Sonarr",
        description: "TV show management",
        iconId: "sonarr",
        tools: {
          searchShows: {
            factory: () => ({
              description: "Search TV shows",
              parameters: z.object({ query: z.string() }),
              execute: async ({ query }) => ({
                type: "tv",
                query,
                results: ["Show 1", "Show 2"],
              }),
            }),
            displayName: "Search Shows",
            description: "Search for TV shows",
            category: "search" as ToolCategory,
            modes: ["chat"],
          },
        },
        healthCheck: async () => true,
      };

      manager.register(moviePlugin);
      manager.register(tvPlugin);

      // Create configs for both services
      const configs = new Map<string, ServiceConfig>();
      configs.set("radarr", createMockConfig("radarr"));
      configs.set("sonarr", createMockConfig("sonarr"));

      const tools = manager.getToolsForSession(mockSession, configs, "chat");

      // Verify both plugins' tools are available
      expect(tools).toHaveProperty("searchMovies");
      expect(tools).toHaveProperty("searchShows");

      // Execute both tools
      const movieResult = await tools.searchMovies.execute(
        { query: "action" },
        {
          messages: [],
          toolCallId: "movie-search",
          abortSignal: new AbortController().signal,
        }
      );

      const tvResult = await tools.searchShows.execute(
        { query: "drama" },
        {
          messages: [],
          toolCallId: "tv-search",
          abortSignal: new AbortController().signal,
        }
      );

      expect(movieResult.type).toBe("movie");
      expect(movieResult.results).toHaveLength(2);
      expect(tvResult.type).toBe("tv");
      expect(tvResult.results).toHaveLength(2);
    });

    it("should only include tools from enabled services", () => {
      const plugin1: ServicePlugin = {
        name: "enabled",
        displayName: "Enabled Service",
        description: "This is enabled",
        iconId: "enabled",
        tools: {
          enabledTool: {
            factory: () => ({
              description: "Enabled tool",
              parameters: z.object({}),
              execute: async () => ({ enabled: true }),
            }),
            displayName: "Enabled Tool",
            description: "Tool from enabled service",
            category: "search" as ToolCategory,
            modes: ["chat"],
          },
        },
        healthCheck: async () => true,
      };

      const plugin2: ServicePlugin = {
        name: "disabled",
        displayName: "Disabled Service",
        description: "This is disabled",
        iconId: "disabled",
        tools: {
          disabledTool: {
            factory: () => ({
              description: "Disabled tool",
              parameters: z.object({}),
              execute: async () => ({ disabled: true }),
            }),
            displayName: "Disabled Tool",
            description: "Tool from disabled service",
            category: "search" as ToolCategory,
            modes: ["chat"],
          },
        },
        healthCheck: async () => true,
      };

      manager.register(plugin1);
      manager.register(plugin2);

      const configs = new Map<string, ServiceConfig>();
      configs.set("enabled", createMockConfig("enabled", { isEnabled: true }));
      configs.set(
        "disabled",
        createMockConfig("disabled", { isEnabled: false })
      );

      const tools = manager.getToolsForSession(mockSession, configs, "chat");

      expect(tools).toHaveProperty("enabledTool");
      expect(tools).not.toHaveProperty("disabledTool");
    });
  });

  describe("Mode-Based Tool Filtering", () => {
    it("should filter tools based on chat mode", () => {
      const multiModePlugin: ServicePlugin = {
        name: "multiMode",
        displayName: "Multi Mode Service",
        description: "Has tools for different modes",
        iconId: "multi",
        tools: {
          chatOnlyTool: {
            factory: () => ({
              description: "Chat only",
              parameters: z.object({}),
              execute: async () => ({}),
            }),
            displayName: "Chat Only",
            description: "Only in chat mode",
            category: "search" as ToolCategory,
            modes: ["chat"],
          },
          discoverTool: {
            factory: () => ({
              description: "Discover mode",
              parameters: z.object({}),
              execute: async () => ({}),
            }),
            displayName: "Discover Tool",
            description: "For discover mode",
            category: "search" as ToolCategory,
            modes: ["discover"],
          },
          bothModesTool: {
            factory: () => ({
              description: "Both modes",
              parameters: z.object({}),
              execute: async () => ({}),
            }),
            displayName: "Both Modes",
            description: "Available in both modes",
            category: "search" as ToolCategory,
            modes: ["chat", "discover"],
          },
        },
        healthCheck: async () => true,
      };

      manager.register(multiModePlugin);

      const configs = new Map<string, ServiceConfig>();
      configs.set("multiMode", createMockConfig("multiMode"));

      // Test chat mode
      const chatTools = manager.getToolsForSession(
        mockSession,
        configs,
        "chat"
      );
      expect(chatTools).toHaveProperty("chatOnlyTool");
      expect(chatTools).not.toHaveProperty("discoverTool");
      expect(chatTools).toHaveProperty("bothModesTool");

      // Test discover mode
      const discoverTools = manager.getToolsForSession(
        mockSession,
        configs,
        "discover"
      );
      expect(discoverTools).not.toHaveProperty("chatOnlyTool");
      expect(discoverTools).toHaveProperty("discoverTool");
      expect(discoverTools).toHaveProperty("bothModesTool");
    });
  });

  describe("Health Check Integration", () => {
    it("should perform health check on plugin", async () => {
      const healthCheckSpy = vi.fn().mockResolvedValue(true);

      const healthyPlugin: ServicePlugin = {
        name: "healthy",
        displayName: "Healthy Service",
        description: "Always healthy",
        iconId: "healthy",
        tools: {},
        healthCheck: healthCheckSpy,
      };

      manager.register(healthyPlugin);

      const plugin = manager.getService("healthy");
      expect(plugin).toBeDefined();

      const config = createMockConfig("healthy");
      const isHealthy = await plugin?.healthCheck(config);

      expect(healthCheckSpy).toHaveBeenCalledWith(config);
      expect(isHealthy).toBe(true);
    });

    it("should handle health check failures", async () => {
      const unhealthyPlugin: ServicePlugin = {
        name: "unhealthy",
        displayName: "Unhealthy Service",
        description: "Always fails health check",
        iconId: "unhealthy",
        tools: {},
        healthCheck: async () => false,
      };

      manager.register(unhealthyPlugin);

      const plugin = manager.getService("unhealthy");
      const config = createMockConfig("unhealthy");
      const isHealthy = await plugin?.healthCheck(config);

      expect(isHealthy).toBe(false);
    });
  });

  describe("Plugin Metadata Access", () => {
    it("should provide access to all registered plugins", () => {
      const plugins = [
        {
          name: "plugin1",
          displayName: "Plugin 1",
          description: "First plugin",
          iconId: "p1",
          tools: {},
          healthCheck: async () => true,
        },
        {
          name: "plugin2",
          displayName: "Plugin 2",
          description: "Second plugin",
          iconId: "p2",
          tools: {},
          healthCheck: async () => true,
        },
        {
          name: "plugin3",
          displayName: "Plugin 3",
          description: "Third plugin",
          iconId: "p3",
          tools: {},
          healthCheck: async () => true,
        },
      ];

      for (const plugin of plugins) {
        manager.register(plugin);
      }

      const allPlugins = manager.getPlugins();

      expect(allPlugins).toHaveLength(3);
      expect(allPlugins.map((p) => p.name)).toEqual([
        "plugin1",
        "plugin2",
        "plugin3",
      ]);
    });

    it("should return plugin display names and descriptions", () => {
      const plugin: ServicePlugin = {
        name: "detailed",
        displayName: "Detailed Plugin",
        description: "A plugin with full metadata",
        iconId: "detailed",
        tools: {
          detailedTool: {
            factory: () => ({
              description: "Tool desc",
              parameters: z.object({}),
              execute: async () => ({}),
            }),
            displayName: "Detailed Tool",
            description: "A tool with full metadata",
            category: "search" as ToolCategory,
            modes: ["chat"],
            metadata: {
              usage: "Use this for detailed operations",
              examples: ["example1", "example2"],
            },
          },
        },
        healthCheck: async () => true,
      };

      manager.register(plugin);

      const registered = manager.getService("detailed");
      expect(registered?.displayName).toBe("Detailed Plugin");
      expect(registered?.description).toBe("A plugin with full metadata");
      expect(registered?.tools.detailedTool.metadata?.usage).toBe(
        "Use this for detailed operations"
      );
      expect(registered?.tools.detailedTool.metadata?.examples).toHaveLength(2);
    });
  });
});
