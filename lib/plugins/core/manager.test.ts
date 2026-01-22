import type { Session } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { ServiceConfig } from "@/lib/db/schema";
import { PluginManager } from "./manager";
import type {
  ServicePlugin,
  ToolCategory,
  ToolDefinition,
  ToolFactoryProps,
} from "./types";

// Mock console.warn to test warning messages
const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

describe("PluginManager", () => {
  let manager: PluginManager;

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

  const createMockToolFactory = (returnValue: string) => {
    return (props: ToolFactoryProps) =>
      ({
        description: "Mock tool",
        inputSchema: z.object({}),
        execute: async () => ({
          result: returnValue,
          userId: props.session.user?.id,
        }),
      }) as any;
  };

  const createMockPlugin = (
    name: string,
    tools: Record<string, ToolDefinition> = {}
  ): ServicePlugin => ({
    name,
    displayName: `${name.charAt(0).toUpperCase()}${name.slice(1)}`,
    description: `Mock ${name} plugin`,
    iconId: name,
    tools,
    healthCheck: async () => true,
  });

  const createMockToolDefinition = (
    toolName: string,
    category: ToolCategory = "search"
  ): ToolDefinition => ({
    factory: createMockToolFactory(`${toolName}-result`),
    displayName: `Mock ${toolName}`,
    description: `Description for ${toolName}`,
    category,
  });

  // Helper to create a fresh manager instance for each test
  const createFreshManager = (): PluginManager => {
    // Create a new instance directly by calling the constructor via reflection
    // Since the class has a private constructor, we need to work around it
    const manager = Object.create(PluginManager.prototype);
    // Initialize the services Map
    Object.defineProperty(manager, "services", {
      value: new Map(),
      writable: true,
      enumerable: true,
      configurable: true,
    });
    return manager;
  };

  beforeEach(() => {
    // Create a fresh manager for each test (not using the singleton)
    manager = createFreshManager();
    consoleWarnSpy.mockClear();
  });

  describe("getInstance()", () => {
    it("should return the same instance (singleton pattern)", () => {
      // Note: This tests the actual singleton behavior of the production PluginManager
      // We're not using our test's createFreshManager() here
      const instance1 = PluginManager.getInstance();
      const instance2 = PluginManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe("register()", () => {
    it("should register a plugin successfully", () => {
      const plugin = createMockPlugin("testService");

      manager.register(plugin);

      expect(manager.getService("testService")).toBe(plugin);
    });

    it("should warn when registering a plugin with duplicate name", () => {
      const plugin1 = createMockPlugin("duplicateService");
      const plugin2 = createMockPlugin("duplicateService");

      manager.register(plugin1);
      manager.register(plugin2);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Plugin duplicateService is already registered. Overwriting."
      );
    });

    it("should overwrite existing plugin when registering duplicate", () => {
      const plugin1 = createMockPlugin("service", {
        tool1: createMockToolDefinition("tool1"),
      });
      const plugin2 = createMockPlugin("service", {
        tool2: createMockToolDefinition("tool2"),
      });

      manager.register(plugin1);
      manager.register(plugin2);

      const registered = manager.getService("service");
      expect(registered?.tools).toHaveProperty("tool2");
      expect(registered?.tools).not.toHaveProperty("tool1");
    });
  });

  describe("getService()", () => {
    it("should return undefined for non-existent service", () => {
      const result = manager.getService("nonExistent");

      expect(result).toBeUndefined();
    });

    it("should return the registered plugin", () => {
      const plugin = createMockPlugin("myService");
      manager.register(plugin);

      const result = manager.getService("myService");

      expect(result).toBe(plugin);
    });
  });

  describe("getPlugins()", () => {
    it("should return empty array when no plugins registered", () => {
      const plugins = manager.getPlugins();

      expect(plugins).toEqual([]);
    });

    it("should return all registered plugins", () => {
      const plugin1 = createMockPlugin("service1");
      const plugin2 = createMockPlugin("service2");
      const plugin3 = createMockPlugin("service3");

      manager.register(plugin1);
      manager.register(plugin2);
      manager.register(plugin3);

      const plugins = manager.getPlugins();

      expect(plugins).toHaveLength(3);
      expect(plugins).toContain(plugin1);
      expect(plugins).toContain(plugin2);
      expect(plugins).toContain(plugin3);
    });
  });

  describe("getAllServices()", () => {
    it("should return the same as getPlugins()", () => {
      const plugin1 = createMockPlugin("service1");
      const plugin2 = createMockPlugin("service2");

      manager.register(plugin1);
      manager.register(plugin2);

      expect(manager.getAllServices()).toEqual(manager.getPlugins());
    });
  });

  describe("getToolsForSession()", () => {
    it("should return empty object when no configs provided", () => {
      const plugin = createMockPlugin("service", {
        searchTool: createMockToolDefinition("searchTool"),
      });
      manager.register(plugin);

      const configs = new Map<string, ServiceConfig>();
      const tools = manager.getToolsForSession(mockSession, configs);

      expect(tools).toEqual({});
    });

    it("should return empty object when service is disabled", () => {
      const plugin = createMockPlugin("service", {
        searchTool: createMockToolDefinition("searchTool"),
      });
      manager.register(plugin);

      const configs = new Map<string, ServiceConfig>();
      configs.set("service", createMockConfig("service", { isEnabled: false }));

      const tools = manager.getToolsForSession(mockSession, configs);

      expect(tools).toEqual({});
    });

    it("should instantiate tools for enabled services", () => {
      const plugin = createMockPlugin("service", {
        searchTool: createMockToolDefinition("searchTool"),
        libraryTool: createMockToolDefinition("libraryTool", "library"),
      });
      manager.register(plugin);

      const configs = new Map<string, ServiceConfig>();
      configs.set("service", createMockConfig("service"));

      const tools = manager.getToolsForSession(mockSession, configs);

      expect(Object.keys(tools)).toHaveLength(2);
      expect(tools).toHaveProperty("searchTool");
      expect(tools).toHaveProperty("libraryTool");
    });

    it("should pass session and config to tool factory", async () => {
      const factoryMock = vi.fn().mockReturnValue({
        execute: async () => ({}),
      });

      const plugin = createMockPlugin("service", {
        testTool: {
          factory: factoryMock,
          displayName: "Test Tool",
          description: "Test description",
          category: "search",
        },
      });
      manager.register(plugin);

      const config = createMockConfig("service");
      const configs = new Map<string, ServiceConfig>();
      configs.set("service", config);

      manager.getToolsForSession(mockSession, configs);

      expect(factoryMock).toHaveBeenCalledWith({
        session: mockSession,
        config,
      });
    });

    it("should instantiate tools from multiple plugins", () => {
      const plugin1 = createMockPlugin("service1", {
        tool1: createMockToolDefinition("tool1"),
      });
      const plugin2 = createMockPlugin("service2", {
        tool2: createMockToolDefinition("tool2"),
      });
      manager.register(plugin1);
      manager.register(plugin2);

      const configs = new Map<string, ServiceConfig>();
      configs.set("service1", createMockConfig("service1"));
      configs.set("service2", createMockConfig("service2"));

      const tools = manager.getToolsForSession(mockSession, configs);

      expect(Object.keys(tools)).toHaveLength(2);
      expect(tools).toHaveProperty("tool1");
      expect(tools).toHaveProperty("tool2");
    });

    it("should only include tools from enabled services", () => {
      const plugin1 = createMockPlugin("enabled", {
        enabledTool: createMockToolDefinition("enabledTool"),
      });
      const plugin2 = createMockPlugin("disabled", {
        disabledTool: createMockToolDefinition("disabledTool"),
      });
      manager.register(plugin1);
      manager.register(plugin2);

      const configs = new Map<string, ServiceConfig>();
      configs.set("enabled", createMockConfig("enabled", { isEnabled: true }));
      configs.set(
        "disabled",
        createMockConfig("disabled", { isEnabled: false })
      );

      const tools = manager.getToolsForSession(mockSession, configs);

      expect(Object.keys(tools)).toHaveLength(1);
      expect(tools).toHaveProperty("enabledTool");
      expect(tools).not.toHaveProperty("disabledTool");
    });

    describe("discover mode filtering", () => {
      it("should only include jellyseerr searchContent and getDiscovery tools in discover mode", () => {
        const radarrPlugin = createMockPlugin("radarr", {
          searchRadarrMovies: createMockToolDefinition("searchRadarrMovies"),
          getRadarrLibrary: createMockToolDefinition(
            "getRadarrLibrary",
            "library"
          ),
        });
        const jellyseerrPlugin = createMockPlugin("jellyseerr", {
          searchContent: createMockToolDefinition("searchContent"),
          getDiscovery: createMockToolDefinition("getDiscovery"),
          getRequests: createMockToolDefinition("getRequests", "management"),
          requestMedia: createMockToolDefinition("requestMedia", "library"),
        });
        manager.register(radarrPlugin);
        manager.register(jellyseerrPlugin);

        const configs = new Map<string, ServiceConfig>();
        configs.set("radarr", createMockConfig("radarr"));
        configs.set("jellyseerr", createMockConfig("jellyseerr"));

        const tools = manager.getToolsForSession(
          mockSession,
          configs,
          "discover"
        );

        expect(Object.keys(tools)).toHaveLength(2);
        expect(tools).toHaveProperty("searchContent");
        expect(tools).toHaveProperty("getDiscovery");
        expect(tools).not.toHaveProperty("searchRadarrMovies");
        expect(tools).not.toHaveProperty("getRadarrLibrary");
        expect(tools).not.toHaveProperty("getRequests");
        expect(tools).not.toHaveProperty("requestMedia");
      });

      it("should include all tools when mode is not discover", () => {
        const radarrPlugin = createMockPlugin("radarr", {
          searchRadarrMovies: createMockToolDefinition("searchRadarrMovies"),
        });
        const jellyseerrPlugin = createMockPlugin("jellyseerr", {
          searchContent: createMockToolDefinition("searchContent"),
          getRequests: createMockToolDefinition("getRequests", "management"),
        });
        manager.register(radarrPlugin);
        manager.register(jellyseerrPlugin);

        const configs = new Map<string, ServiceConfig>();
        configs.set("radarr", createMockConfig("radarr"));
        configs.set("jellyseerr", createMockConfig("jellyseerr"));

        const tools = manager.getToolsForSession(mockSession, configs);

        expect(Object.keys(tools)).toHaveLength(3);
        expect(tools).toHaveProperty("searchRadarrMovies");
        expect(tools).toHaveProperty("searchContent");
        expect(tools).toHaveProperty("getRequests");
      });

      it("should include all tools when mode is undefined", () => {
        const plugin = createMockPlugin("jellyseerr", {
          searchContent: createMockToolDefinition("searchContent"),
          getDiscovery: createMockToolDefinition("getDiscovery"),
          getRequests: createMockToolDefinition("getRequests", "management"),
        });
        manager.register(plugin);

        const configs = new Map<string, ServiceConfig>();
        configs.set("jellyseerr", createMockConfig("jellyseerr"));

        const tools = manager.getToolsForSession(
          mockSession,
          configs,
          undefined
        );

        expect(Object.keys(tools)).toHaveLength(3);
      });

      it("should exclude non-jellyseerr plugins entirely in discover mode", () => {
        const sonarrPlugin = createMockPlugin("sonarr", {
          searchSonarrSeries: createMockToolDefinition("searchSonarrSeries"),
        });
        const jellyfinPlugin = createMockPlugin("jellyfin", {
          searchMedia: createMockToolDefinition("searchMedia"),
        });
        manager.register(sonarrPlugin);
        manager.register(jellyfinPlugin);

        const configs = new Map<string, ServiceConfig>();
        configs.set("sonarr", createMockConfig("sonarr"));
        configs.set("jellyfin", createMockConfig("jellyfin"));

        const tools = manager.getToolsForSession(
          mockSession,
          configs,
          "discover"
        );

        expect(Object.keys(tools)).toHaveLength(0);
      });
    });

    it("should skip plugins without matching config", () => {
      const plugin = createMockPlugin("noConfig", {
        someTool: createMockToolDefinition("someTool"),
      });
      manager.register(plugin);

      const configs = new Map<string, ServiceConfig>();
      // Not adding config for "noConfig" service

      const tools = manager.getToolsForSession(mockSession, configs);

      expect(tools).toEqual({});
    });
  });

  describe("integration with tool execution", () => {
    it("should create functional tools that can be executed", async () => {
      const mockToolResult = { data: "test result" };
      const factoryFn = vi.fn().mockReturnValue({
        execute: vi.fn().mockResolvedValue(mockToolResult),
        inputSchema: {},
        description: "Test tool",
      });

      const plugin = createMockPlugin("testService", {
        executableTool: {
          factory: factoryFn,
          displayName: "Executable Tool",
          description: "A tool that executes",
          category: "search",
        },
      });
      manager.register(plugin);

      const configs = new Map<string, ServiceConfig>();
      configs.set("testService", createMockConfig("testService"));

      const tools = manager.getToolsForSession(mockSession, configs);
      const result = await tools.executableTool.execute(
        {},
        {
          messages: [],
          toolCallId: "test-call",
          abortSignal: new AbortController().signal,
        }
      );

      expect(result).toEqual(mockToolResult);
    });
  });
});
