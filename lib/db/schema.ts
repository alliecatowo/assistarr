import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  json,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Enum for service operation modes
// - read: Only read operations (search, get queue, calendar, etc.)
// - write: Read + write operations (add movies, request media, etc.)
// - yolo: All operations without confirmation prompts
export const serviceModeEnum = pgEnum("service_mode", [
  "read",
  "write",
  "yolo",
]);

export type ServiceMode = "read" | "write" | "yolo";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable(
  "Chat",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    visibility: varchar("visibility", { enum: ["public", "private"] })
      .notNull()
      .default("private"),
  },
  (table) => ({
    userCreatedAtIdx: index("chat_user_created_at_idx").on(
      table.userId,
      table.createdAt
    ),
  })
);

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable(
  "Message_v2",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    role: varchar("role").notNull(),
    parts: json("parts").notNull(),
    attachments: json("attachments").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    chatCreatedAtIdx: index("message_chat_created_at_idx").on(
      table.chatId,
      table.createdAt
    ),
  })
);

export type DBMessage = InferSelectModel<typeof message>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  }
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

export const serviceConfig = pgTable(
  "ServiceConfig",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    serviceName: varchar("serviceName", { length: 50 }).notNull(), // 'radarr', 'sonarr', 'jellyfin', 'jellyseerr'
    baseUrl: text("baseUrl").notNull(),
    apiKey: text("apiKey").notNull(),
    isEnabled: boolean("isEnabled").notNull().default(true),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    userServiceNameIdx: index("service_config_user_service_name_idx").on(
      table.userId,
      table.serviceName
    ),
  })
);

export type ServiceConfig = InferSelectModel<typeof serviceConfig>;

// Model tier enum for AI quality/speed presets
export const modelTierEnum = pgEnum("model_tier", [
  "lite",
  "fast",
  "heavy",
  "thinking",
]);

export type ModelTierType = "lite" | "fast" | "heavy" | "thinking";

// User AI provider configurations (Bring Your Own Keys)
export const userAIConfig = pgTable(
  "UserAIConfig",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    providerName: varchar("providerName", { length: 50 }).notNull(), // 'openrouter', 'openai', 'anthropic', 'google', 'gateway'
    apiKey: text("apiKey").notNull(), // Encrypted at rest
    isEnabled: boolean("isEnabled").notNull().default(true),
    preferredModelTier: modelTierEnum("preferredModelTier").default("fast"),
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    userProviderIdx: index("user_ai_config_user_provider_idx").on(
      table.userId,
      table.providerName
    ),
  })
);

export type UserAIConfig = InferSelectModel<typeof userAIConfig>;

// Transport type for MCP servers
export const mcpTransportEnum = pgEnum("mcp_transport", ["sse", "http"]);

export type MCPTransportType = "sse" | "http";

// MCP Server configurations (user-defined external tool servers)
export const mcpServerConfig = pgTable(
  "MCPServerConfig",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    name: varchar("name", { length: 100 }).notNull(), // User-friendly display name
    url: text("url").notNull(), // MCP server URL (HTTP/SSE endpoint)
    transport: mcpTransportEnum("transport").notNull().default("sse"),
    apiKey: text("apiKey"), // Optional auth token (encrypted)
    headers: json("headers").$type<Record<string, string>>(), // Optional custom headers
    isEnabled: boolean("isEnabled").notNull().default(true),
    lastHealthCheck: timestamp("lastHealthCheck"),
    availableTools: json("availableTools").$type<MCPToolInfo[]>(), // Cached tool list
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("mcp_server_config_user_idx").on(table.userId),
    userNameIdx: index("mcp_server_config_user_name_idx").on(
      table.userId,
      table.name
    ),
  })
);

// Type for cached MCP tool information
export interface MCPToolInfo {
  name: string;
  description: string;
  inputSchema?: object;
}

export type MCPServerConfig = InferSelectModel<typeof mcpServerConfig>;

// Skill source type
export const skillSourceEnum = pgEnum("skill_source", [
  "user",
  "plugin",
  "builtin",
]);

export type SkillSourceType = "user" | "plugin" | "builtin";

// User Skills (AI instruction sets following Agent Skills spec)
export const userSkill = pgTable(
  "UserSkill",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    name: varchar("name", { length: 100 }).notNull(), // Skill identifier (from SKILL.md frontmatter)
    displayName: varchar("displayName", { length: 200 }).notNull(),
    description: text("description").notNull(), // When to use this skill
    instructions: text("instructions").notNull(), // Full markdown instructions
    isEnabled: boolean("isEnabled").notNull().default(true),
    source: skillSourceEnum("source").notNull().default("user"),
    pluginName: varchar("pluginName", { length: 50 }), // If source='plugin', which plugin
    createdAt: timestamp("createdAt").notNull().defaultNow(),
    updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("user_skill_user_idx").on(table.userId),
    userNameIdx: index("user_skill_user_name_idx").on(table.userId, table.name),
  })
);

export type UserSkill = InferSelectModel<typeof userSkill>;
