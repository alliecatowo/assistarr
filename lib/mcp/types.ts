import type { MCPToolInfo } from "../db/schema";

// Re-export database types
export type { MCPServerConfig, MCPToolInfo } from "../db/schema";

// MCP transport types
export type MCPTransport = "sse" | "http";

// Options for creating an MCP client
export interface MCPClientOptions {
  url: string;
  transport: MCPTransport;
  headers?: Record<string, string>;
  apiKey?: string | null;
}

// Result from MCP tool discovery
export interface MCPDiscoveryResult {
  tools: MCPToolInfo[];
  serverName: string;
}

// Namespaced tool info (for display in UI)
export interface NamespacedMCPTool {
  originalName: string;
  namespacedName: string;
  description: string;
  serverName: string;
  inputSchema?: object;
}

// Health check result
export interface MCPHealthCheckResult {
  success: boolean;
  latency?: number;
  error?: string;
  tools?: MCPToolInfo[];
}

// MCP client wrapper for cleanup tracking
export interface MCPClientWrapper {
  client: unknown; // The actual MCP client from AI SDK
  serverName: string;
  close: () => Promise<void>;
}
