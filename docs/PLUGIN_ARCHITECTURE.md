# Plugin Architecture

This document describes the plugin-based architecture for adding service integrations to Assistarr.

## Overview

The plugin system provides a clean, extensible way to add new external service integrations (like Radarr, Sonarr, Jellyfin, etc.). Each service is defined as a self-contained module that exports a `ServiceDefinition`, which the registry automatically discovers and integrates into the AI chat system.

## Architecture

```
lib/ai/tools/services/
  base.ts              # Core types and interfaces
  registry.ts          # Service registry and tool management
  radarr/
    definition.ts      # ServiceDefinition for Radarr
    client.ts          # API client
    types.ts           # TypeScript types
    search-movies.ts   # Individual tool implementations
    add-movie.ts
    ...
  sonarr/
    definition.ts
    ...
  [new-service]/
    definition.ts      # Your new service definition
    ...
```

## Core Types

### ServiceDefinition

The main interface that all services must implement:

```typescript
interface ServiceDefinition {
  // Unique identifier matching the serviceName in database
  name: string;

  // Human-readable display name
  displayName: string;

  // Description of what the service does
  description: string;

  // Map of tool names to their factory functions
  tools: Record<string, ToolFactory>;

  // Optional health check function
  healthCheck?: (props: HealthCheckProps) => Promise<boolean>;
}
```

### ToolFactory

A function that creates a tool instance:

```typescript
type ToolFactory = (props: ToolFactoryProps) => Tool<any, any>;

interface ToolFactoryProps {
  session: Session;
}
```

## Adding a New Service

Follow these steps to add a new service integration:

### 1. Create the Service Directory

```bash
mkdir lib/ai/tools/services/your-service
```

### 2. Create the Client

Create `lib/ai/tools/services/your-service/client.ts`:

```typescript
import { getServiceConfig } from "@/lib/db/queries";
import type { ServiceConfig } from "@/lib/db/schema";

export class YourServiceClientError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "YourServiceClientError";
  }
}

export async function getYourServiceConfig(
  userId: string
): Promise<ServiceConfig | null> {
  return getServiceConfig({ userId, serviceName: "your-service" });
}

export async function yourServiceRequest<T>(
  userId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = await getYourServiceConfig(userId);

  if (!config) {
    throw new YourServiceClientError(
      "Your Service is not configured. Please configure it in settings."
    );
  }

  if (!config.isEnabled) {
    throw new YourServiceClientError(
      "Your Service is disabled. Please enable it in settings."
    );
  }

  const url = `${config.baseUrl}/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "X-Api-Key": config.apiKey,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new YourServiceClientError(
      `API error: ${response.status}`,
      response.status
    );
  }

  return response.json();
}
```

### 3. Create Types

Create `lib/ai/tools/services/your-service/types.ts`:

```typescript
export interface YourType {
  id: number;
  name: string;
  // ... other fields
}
```

### 4. Create Tool Implementations

Create `lib/ai/tools/services/your-service/your-tool.ts`:

```typescript
import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";
import { yourServiceRequest, YourServiceClientError } from "./client";
import type { YourType } from "./types";

type YourToolProps = {
  session: Session;
};

export const yourTool = ({ session }: YourToolProps) =>
  tool({
    description: "Description of what this tool does",
    inputSchema: z.object({
      param: z.string().describe("Parameter description"),
    }),
    execute: async ({ param }) => {
      try {
        const result = await yourServiceRequest<YourType>(
          session.user.id,
          `/endpoint?param=${encodeURIComponent(param)}`
        );
        return { success: true, data: result };
      } catch (error) {
        if (error instanceof YourServiceClientError) {
          return { error: error.message };
        }
        return { error: "An error occurred" };
      }
    },
  });
```

### 5. Create the Service Definition

Create `lib/ai/tools/services/your-service/definition.ts`:

```typescript
import type { ServiceDefinition } from "../base";
import { yourTool } from "./your-tool";
import { anotherTool } from "./another-tool";

export const yourServiceService: ServiceDefinition = {
  name: "your-service",  // Must match serviceName in database
  displayName: "Your Service",
  description: "Description of what your service does",
  tools: {
    yourTool,
    anotherTool,
  },
  healthCheck: async ({ config }) => {
    try {
      const response = await fetch(`${config.baseUrl}/api/health`, {
        headers: {
          "X-Api-Key": config.apiKey,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
```

### 6. Register the Service

Update `lib/ai/tools/services/registry.ts`:

```typescript
// Add import
import { yourServiceService } from "./your-service/definition";

// Add to registry array
const serviceRegistry: ServiceDefinition[] = [
  radarrService,
  sonarrService,
  jellyfinService,
  jellyseerrService,
  qbittorrentService,
  yourServiceService,  // Add your service here
];
```

### 7. Create the Index Export (Optional)

Create `lib/ai/tools/services/your-service/index.ts`:

```typescript
export { yourTool } from "./your-tool";
export { anotherTool } from "./another-tool";
export type * from "./types";
export { yourServiceRequest, getYourServiceConfig, YourServiceClientError } from "./client";
```

## How It Works

### Tool Registration Flow

1. When a chat request comes in, the chat route calls `getServiceConfigs()` to get all configured services for the user
2. The configs are converted to a Map and passed to `getEnabledTools()`
3. The registry iterates through all registered services
4. For each enabled service (has config with `isEnabled: true`), it instantiates all tools
5. The tools are merged with core tools and passed to `streamText()`

### Runtime Behavior

- Tools are only instantiated for services that are:
  1. Registered in the registry
  2. Configured by the user in the database
  3. Enabled (`isEnabled: true`)

- Each tool factory receives the session, allowing tools to:
  - Access `session.user.id` for user-specific API calls
  - Fetch user-specific service configurations

## Registry API

### getEnabledTools(session, configs)

Returns tools and their names for all enabled services.

```typescript
const { tools, toolNames } = getEnabledTools(session, configsMap);
```

### getService(name)

Get a specific service definition by name.

```typescript
const service = getService("radarr");
```

### getAllServices()

Get all registered service definitions.

```typescript
const services = getAllServices();
```

### checkServiceHealth(serviceName, config)

Perform a health check on a service.

```typescript
const isHealthy = await checkServiceHealth("radarr", config);
```

### getEnabledServices(configs)

Get all enabled service definitions.

```typescript
const enabledServices = getEnabledServices(configsMap);
```

## Best Practices

1. **Naming Conventions**
   - Service name should be lowercase and match the database `serviceName`
   - Tool names should be camelCase and descriptive
   - Prefix queue/calendar tools with service name (e.g., `getRadarrQueue`, `getSonarrQueue`)

2. **Error Handling**
   - Create a custom error class for your service (e.g., `YourServiceClientError`)
   - Return user-friendly error messages from tools
   - Include status codes when available

3. **Tool Design**
   - Use descriptive tool descriptions that help the AI understand when to use them
   - Validate inputs with zod schemas
   - Return structured results that are easy for the AI to interpret
   - Use `needsApproval: true` for tools that modify data

4. **Health Checks**
   - Implement health checks for services that support them
   - Use lightweight endpoints (status/health)
   - Handle network errors gracefully

5. **Type Safety**
   - Define TypeScript types for all API responses
   - Use the tool's generic parameters when possible
   - Export types from the index for reuse

## Example: Complete Service

See the existing service implementations for complete examples:

- `/lib/ai/tools/services/radarr/` - Movie management
- `/lib/ai/tools/services/sonarr/` - TV series management
- `/lib/ai/tools/services/jellyfin/` - Media streaming
- `/lib/ai/tools/services/jellyseerr/` - Media requests
- `/lib/ai/tools/services/qbittorrent/` - Torrent management
