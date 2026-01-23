// MCP Client Management
export {
  checkMCPHealth,
  createMCPClientWrapper,
  discoverMCPTools,
  getMCPTools,
  namespaceMCPTool,
  sanitizeName,
} from "./client-manager";

// Tool Adaptation
export {
  adaptMCPTools,
  getMCPToolsInfo,
  mergeMCPToolsWithBase,
} from "./tool-adapter";

// Types
export type {
  MCPClientOptions,
  MCPClientWrapper,
  MCPDiscoveryResult,
  MCPHealthCheckResult,
  MCPServerConfig,
  MCPToolInfo,
  MCPTransport,
  NamespacedMCPTool,
} from "./types";
