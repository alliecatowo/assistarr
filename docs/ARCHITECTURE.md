# Assistarr Architecture

## Overview

Assistarr is a Next.js-based AI chatbot application that integrates with media management services (Radarr, Sonarr, Jellyfin, Jellyseerr) to help users manage their media libraries through natural language conversations.

The application is built on the Vercel AI SDK and uses a tool-based architecture where the AI can invoke specific tools to interact with external services.

---

## System Architecture Diagram

```
+------------------+     +------------------+     +------------------+
|                  |     |                  |     |                  |
|   Browser/UI     |---->|   Next.js API    |---->|   AI Provider    |
|   (React)        |     |   Routes         |     |   (Gateway)      |
|                  |     |                  |     |                  |
+------------------+     +--------+---------+     +------------------+
                                 |
                                 v
                    +------------+------------+
                    |                         |
                    |      AI SDK Tools       |
                    |   (Tool Definitions)    |
                    |                         |
                    +------------+------------+
                                 |
         +-----------+-----------+-----------+-----------+
         |           |           |           |           |
         v           v           v           v           v
    +--------+  +--------+  +--------+  +--------+  +--------+
    |        |  |        |  |        |  |        |  |        |
    | Radarr |  | Sonarr |  |Jellyfin|  |Jellys- |  | More   |
    |  API   |  |  API   |  |  API   |  | eerr   |  | Tools  |
    |        |  |        |  |        |  |  API   |  |        |
    +--------+  +--------+  +--------+  +--------+  +--------+
```

---

## Core Components

### 1. Frontend Layer (`/app`, `/components`)

The UI is built with React 19 and Next.js 16 App Router.

**Key Components:**

| Component | Location | Purpose |
|-----------|----------|---------|
| `Chat` | `/components/chat.tsx` | Main chat interface |
| `Messages` | `/components/messages.tsx` | Message rendering |
| `MultimodalInput` | `/components/multimodal-input.tsx` | User input with attachments |
| `AppSidebar` | `/components/app-sidebar.tsx` | Navigation and chat history |
| `Artifact` | `/components/artifact.tsx` | Document/code viewer |

**Data Flow:**
1. User types message in `MultimodalInput`
2. Message sent via `useChat` hook from `@ai-sdk/react`
3. Streamed response rendered in `Messages` component
4. Tool calls displayed in specialized `Tool` components

### 2. API Layer (`/app/(chat)/api`)

Next.js API routes handle chat requests and authentication.

**Key Routes:**

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/chat` | POST | Process chat messages, invoke AI |
| `/api/chat` | DELETE | Delete a chat |
| `/api/chat/[id]/stream` | GET | Resume interrupted streams |
| `/api/history` | GET/DELETE | Chat history management |
| `/api/document` | GET/POST | Document CRUD |

**Chat API Flow (`/app/(chat)/api/chat/route.ts`):**

```typescript
// Simplified flow
POST /api/chat
  -> Authenticate user (session)
  -> Validate request body
  -> Check rate limits
  -> Load/create chat
  -> Build message history
  -> Call streamText() with tools
  -> Stream response to client
  -> Save messages to database
```

### 3. AI Layer (`/lib/ai`)

Handles AI model configuration, prompts, and tool definitions.

**Components:**

| File | Purpose |
|------|---------|
| `providers.ts` | AI Gateway configuration, model wrappers |
| `prompts.ts` | System prompts and templates |
| `models.ts` | Available model definitions |
| `entitlements.ts` | User type permissions and limits |
| `tools/` | AI SDK tool definitions |

**Provider Setup:**

```typescript
// Uses Vercel AI Gateway
import { gateway } from "@ai-sdk/gateway";

export function getLanguageModel(modelId: string) {
  // Handles reasoning models with special middleware
  if (isReasoningModel) {
    return wrapLanguageModel({
      model: gateway.languageModel(gatewayModelId),
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    });
  }
  return gateway.languageModel(modelId);
}
```

### 4. Database Layer (`/lib/db`)

PostgreSQL database with Drizzle ORM.

**Schema Tables:**
- `User` - User accounts
- `Chat` - Chat sessions
- `Message_v2` - Chat messages
- `Vote_v2` - Message feedback
- `Document` - Generated artifacts
- `Suggestion` - Document suggestions
- `Stream` - Stream resumption tracking
- `ServiceConfig` - External service configurations

See [DATABASE.md](./DATABASE.md) for detailed schema documentation.

---

## Service Configuration and Storage

### How Services Are Configured

Services are configured per-user and stored in the `ServiceConfig` table.

**Configuration Fields:**
- `serviceName` - Identifier (radarr, sonarr, jellyfin, jellyseerr)
- `baseUrl` - API endpoint URL
- `apiKey` - Authentication key
- `isEnabled` - Active/inactive toggle

### Storage Architecture

```
User
  |
  +-- ServiceConfig (radarr)
  |     - baseUrl: http://localhost:7878
  |     - apiKey: ****
  |     - isEnabled: true
  |
  +-- ServiceConfig (sonarr)
  |     - baseUrl: http://localhost:8989
  |     - apiKey: ****
  |     - isEnabled: true
  |
  +-- ServiceConfig (jellyfin)
        - baseUrl: http://localhost:8096
        - apiKey: ****
        - isEnabled: false
```

### Configuration Retrieval in Tools

Tools retrieve service configuration at execution time:

```typescript
// In a tool's execute function
execute: async (input, { session }) => {
  // Get user's service config from database
  const config = await getServiceConfig({
    userId: session.user.id,
    serviceName: "radarr",
  });

  if (!config || !config.isEnabled) {
    return { error: "Radarr is not configured" };
  }

  // Use config to make API call
  const response = await fetch(`${config.baseUrl}/api/v3/movie`, {
    headers: { "X-Api-Key": config.apiKey },
  });

  return response.json();
}
```

---

## AI Tools and Service Interactions

### Tool Architecture

Tools are defined using the Vercel AI SDK `tool()` function:

```typescript
import { tool } from "ai";
import { z } from "zod";

export const myTool = tool({
  description: "Description shown to AI for tool selection",
  inputSchema: z.object({
    parameter: z.string().describe("Parameter description"),
  }),
  needsApproval: true, // Requires user confirmation before execution
  execute: async (input, context) => {
    // Tool logic here
    return result;
  },
});
```

### Tool Registration

Tools are registered in the chat route:

```typescript
// /app/(chat)/api/chat/route.ts
const result = streamText({
  model: getLanguageModel(selectedChatModel),
  system: systemPrompt({ selectedChatModel, requestHints }),
  messages: modelMessages,
  tools: {
    getWeather,
    createDocument: createDocument({ session, dataStream }),
    updateDocument: updateDocument({ session, dataStream }),
    requestSuggestions: requestSuggestions({ session, dataStream }),
    // Service tools would be added here:
    // radarrSearch: radarrSearch({ session }),
    // sonarrSearch: sonarrSearch({ session }),
  },
  experimental_activeTools: ["getWeather", "createDocument", ...],
});
```

### Tool Approval Flow

For tools with `needsApproval: true`:

1. AI decides to call a tool
2. Tool call sent to client with pending status
3. User sees confirmation dialog
4. User approves or rejects
5. If approved, tool executes and returns result
6. AI processes result and continues

---

## Data Flow: Chat to Service Response

### Complete Request Lifecycle

```
1. USER INPUT
   User: "Search for 'Inception' in Radarr"

   +------------------+
   |  MultimodalInput |
   +--------+---------+
            |
            v
2. API REQUEST
   POST /api/chat
   Body: { message: {...}, id: "chat-id", ... }

   +------------------+
   |   Chat Route     |
   +--------+---------+
            |
            v
3. AI PROCESSING
   streamText() with system prompt and tools

   +------------------+
   |   AI Provider    |
   +--------+---------+
            |
            v
4. TOOL SELECTION
   AI determines: "I should use radarrSearch tool"

   +------------------+
   |   Tool Call      |
   +--------+---------+
            |
            v
5. TOOL EXECUTION (if approved)
   - Retrieve user's Radarr config from DB
   - Make API call to Radarr service
   - Return structured result

   +------------------+
   |  Radarr API      |
   +--------+---------+
            |
            v
6. RESULT PROCESSING
   AI receives tool result
   Generates natural language response

   +------------------+
   |   AI Provider    |
   +--------+---------+
            |
            v
7. STREAM TO CLIENT
   Response streamed via SSE

   +------------------+
   |   Chat Route     |
   +--------+---------+
            |
            v
8. UI UPDATE
   Messages rendered, tool results displayed

   +------------------+
   |   Messages UI    |
   +------------------+
```

### Example Tool Implementation (Radarr Search)

```typescript
// /lib/ai/tools/services/radarr-search.ts
import { tool } from "ai";
import { z } from "zod";
import { getServiceConfig } from "@/lib/db/queries";

type RadarrSearchProps = {
  session: Session;
};

export const radarrSearch = ({ session }: RadarrSearchProps) =>
  tool({
    description: "Search for movies in Radarr by title",
    inputSchema: z.object({
      query: z.string().describe("Movie title to search for"),
    }),
    needsApproval: true,
    execute: async ({ query }) => {
      // 1. Get user's Radarr configuration
      const config = await getServiceConfig({
        userId: session.user.id,
        serviceName: "radarr",
      });

      if (!config || !config.isEnabled) {
        return {
          error: "Radarr is not configured. Please add your Radarr settings.",
        };
      }

      // 2. Make API call to Radarr
      const response = await fetch(
        `${config.baseUrl}/api/v3/movie/lookup?term=${encodeURIComponent(query)}`,
        {
          headers: {
            "X-Api-Key": config.apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        return { error: `Radarr API error: ${response.statusText}` };
      }

      // 3. Return structured result
      const movies = await response.json();
      return {
        results: movies.slice(0, 5).map((movie: any) => ({
          title: movie.title,
          year: movie.year,
          overview: movie.overview?.substring(0, 200),
          tmdbId: movie.tmdbId,
          inLibrary: movie.id !== undefined,
        })),
        totalResults: movies.length,
      };
    },
  });
```

---

## Authentication and Security

### Authentication Flow

1. NextAuth.js handles authentication
2. Session stored in JWT
3. Session validated on each API request
4. User ID used to scope all database queries

### Security Considerations

- **API Keys**: Stored encrypted in database, never exposed to client
- **Service Access**: Tools only access services the user has configured
- **Rate Limiting**: Message limits per user type (guest vs regular)
- **Session Validation**: Every API route validates session before processing

---

## Streaming Architecture

### Message Streaming

Uses Vercel AI SDK's `createUIMessageStream`:

```typescript
const stream = createUIMessageStream({
  execute: async ({ writer: dataStream }) => {
    const result = streamText({...});
    dataStream.merge(result.toUIMessageStream({ sendReasoning: true }));
  },
  onFinish: async ({ messages }) => {
    // Save messages to database
    await saveMessages({ messages: [...] });
  },
});
```

### Stream Resumption

Redis-backed stream persistence for interrupted connections:

```typescript
// If user reconnects, can resume from last position
const streamContext = createResumableStreamContext({ waitUntil: after });
await streamContext.createNewResumableStream(streamId, () => sseStream);
```

---

## File Structure Summary

```
assistarr/
+-- app/
|   +-- (auth)/           # Auth pages and API
|   |   +-- api/auth/     # NextAuth routes
|   |   +-- login/        # Login page
|   |   +-- register/     # Registration page
|   +-- (chat)/           # Chat interface
|       +-- api/          # Chat API routes
|       +-- [id]/         # Dynamic chat routes
|       +-- page.tsx      # Main chat page
+-- components/
|   +-- ui/               # Shadcn UI components
|   +-- elements/         # Chat-specific elements
|   +-- ai-elements/      # AI response elements
|   +-- chat.tsx          # Main chat component
|   +-- messages.tsx      # Message list
+-- lib/
|   +-- ai/
|   |   +-- tools/        # AI SDK tool definitions
|   |   |   +-- services/ # Service integration tools
|   |   +-- prompts.ts    # System prompts
|   |   +-- providers.ts  # AI provider config
|   +-- db/
|   |   +-- schema.ts     # Drizzle schema
|   |   +-- queries.ts    # Database operations
|   |   +-- migrations/   # SQL migrations
|   +-- types.ts          # TypeScript types
|   +-- utils.ts          # Utility functions
+-- docs/
|   +-- ARCHITECTURE.md   # This file
|   +-- DATABASE.md       # Database documentation
|   +-- SETUP.md          # Setup instructions
+-- public/               # Static assets
```

---

## Adding New Services

To add a new service integration:

1. **Add to ServiceConfig schema** (if needed):
   - Service name already supports any string
   - Document in DATABASE.md

2. **Create service tool**:
   ```typescript
   // /lib/ai/tools/services/new-service.ts
   export const newServiceTool = ({ session }) => tool({...});
   ```

3. **Register in chat route**:
   ```typescript
   // /app/(chat)/api/chat/route.ts
   tools: {
     ...existingTools,
     newServiceTool: newServiceTool({ session }),
   },
   ```

4. **Add to active tools list**:
   ```typescript
   experimental_activeTools: [...existing, "newServiceTool"],
   ```

5. **Create UI components** (if needed):
   - Tool result display component
   - Configuration UI for settings page

---

## Environment Configuration

Required environment variables:

| Variable | Purpose |
|----------|---------|
| `AUTH_SECRET` | NextAuth encryption key |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway API key |
| `POSTGRES_URL` | Neon PostgreSQL connection |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob for file uploads |
| `REDIS_URL` | Stream resumption (optional) |

See [SETUP.md](./SETUP.md) for complete setup instructions.
