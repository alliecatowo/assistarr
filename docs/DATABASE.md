# Database Configuration

## Neon PostgreSQL

Assistarr uses Neon serverless PostgreSQL for data storage with Drizzle ORM.

### Branches

| Branch | Purpose | Branch ID |
|--------|---------|-----------|
| `production` | Production data | `br-bitter-violet-affrb9ns` |
| `dev` | Development/testing | `br-crimson-dew-af97gnbi` |

### Project Details

- **Project Name:** assistarr
- **Project ID:** `bold-hall-52020597`
- **Region:** us-west-2

### Connection

Development connection string is stored in `.env.local` as `POSTGRES_URL`.

---

## Schema Overview

The database includes the following tables:

| Table | Description |
|-------|-------------|
| `User` | User accounts |
| `Chat` | Chat sessions |
| `Message_v2` | Chat messages with parts |
| `Vote_v2` | Message votes |
| `Document` | Generated documents |
| `Suggestion` | Document suggestions |
| `Stream` | Resumable stream tracking |
| `ServiceConfig` | Service API configurations (Radarr, Sonarr, etc.) |

---

## ServiceConfig Table

The `ServiceConfig` table stores external service configurations for media management integrations.

### Table Structure

```typescript
export const serviceConfig = pgTable("ServiceConfig", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  serviceName: varchar("serviceName", { length: 50 }).notNull(),
  baseUrl: text("baseUrl").notNull(),
  apiKey: text("apiKey").notNull(),
  isEnabled: boolean("isEnabled").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
```

### Column Details

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `userId` | UUID | Foreign key to User table |
| `serviceName` | VARCHAR(50) | Service identifier (see available services) |
| `baseUrl` | TEXT | Service API base URL (e.g., `http://localhost:7878`) |
| `apiKey` | TEXT | API key for authentication |
| `isEnabled` | BOOLEAN | Whether the service is active (default: true) |
| `createdAt` | TIMESTAMP | Record creation timestamp |
| `updatedAt` | TIMESTAMP | Last update timestamp |

### Available Service Names

| Service Name | Description | Default Port |
|--------------|-------------|--------------|
| `radarr` | Movie management and automation | 7878 |
| `sonarr` | TV show management and automation | 8989 |
| `jellyfin` | Media server and streaming | 8096 |
| `jellyseerr` | Media request management | 5055 |
| `qbittorrent` | Torrent client for downloads | 8080 |

### TypeScript Type

```typescript
export type ServiceConfig = InferSelectModel<typeof serviceConfig>;

// Resulting type:
type ServiceConfig = {
  id: string;
  userId: string;
  serviceName: string;
  baseUrl: string;
  apiKey: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};
```

---

## CRUD Operations for ServiceConfig

The following query functions are available in `/lib/db/queries.ts`:

### Create Service Config

```typescript
export async function createServiceConfig({
  userId,
  serviceName,
  baseUrl,
  apiKey,
}: {
  userId: string;
  serviceName: string;
  baseUrl: string;
  apiKey: string;
}): Promise<ServiceConfig> {
  try {
    const [newConfig] = await db
      .insert(serviceConfig)
      .values({
        userId,
        serviceName,
        baseUrl,
        apiKey,
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newConfig;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create service config"
    );
  }
}
```

### Get Service Config by User and Service Name

```typescript
export async function getServiceConfig({
  userId,
  serviceName,
}: {
  userId: string;
  serviceName: string;
}): Promise<ServiceConfig | null> {
  try {
    const [config] = await db
      .select()
      .from(serviceConfig)
      .where(
        and(
          eq(serviceConfig.userId, userId),
          eq(serviceConfig.serviceName, serviceName)
        )
      );
    return config || null;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get service config"
    );
  }
}
```

### Get All Service Configs for User

```typescript
export async function getServiceConfigsByUserId({
  userId,
}: {
  userId: string;
}): Promise<ServiceConfig[]> {
  try {
    return await db
      .select()
      .from(serviceConfig)
      .where(eq(serviceConfig.userId, userId));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get service configs"
    );
  }
}
```

### Update Service Config

```typescript
export async function updateServiceConfig({
  id,
  baseUrl,
  apiKey,
  isEnabled,
}: {
  id: string;
  baseUrl?: string;
  apiKey?: string;
  isEnabled?: boolean;
}): Promise<ServiceConfig> {
  try {
    const updates: Partial<ServiceConfig> = { updatedAt: new Date() };
    if (baseUrl !== undefined) updates.baseUrl = baseUrl;
    if (apiKey !== undefined) updates.apiKey = apiKey;
    if (isEnabled !== undefined) updates.isEnabled = isEnabled;

    const [updated] = await db
      .update(serviceConfig)
      .set(updates)
      .where(eq(serviceConfig.id, id))
      .returning();
    return updated;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update service config"
    );
  }
}
```

### Delete Service Config

```typescript
export async function deleteServiceConfig({
  id,
}: {
  id: string;
}): Promise<void> {
  try {
    await db.delete(serviceConfig).where(eq(serviceConfig.id, id));
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete service config"
    );
  }
}
```

### Example Usage

```typescript
import {
  createServiceConfig,
  getServiceConfig,
  getServiceConfigsByUserId,
  updateServiceConfig,
  deleteServiceConfig,
} from "@/lib/db/queries";

// Create a new Radarr configuration
const radarrConfig = await createServiceConfig({
  userId: session.user.id,
  serviceName: "radarr",
  baseUrl: "http://localhost:7878",
  apiKey: "your-radarr-api-key",
});

// Get a specific service config
const config = await getServiceConfig({
  userId: session.user.id,
  serviceName: "radarr",
});

// Get all service configs for a user
const allConfigs = await getServiceConfigsByUserId({
  userId: session.user.id,
});

// Update a service config
const updated = await updateServiceConfig({
  id: radarrConfig.id,
  baseUrl: "http://192.168.1.100:7878",
  isEnabled: true,
});

// Delete a service config
await deleteServiceConfig({ id: radarrConfig.id });
```

---

## Database Commands

```bash
# Generate new migration after schema changes
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Drizzle Studio (database GUI)
pnpm db:studio

# Push schema directly (development only)
pnpm db:push

# Pull schema from database
pnpm db:pull

# Check migration status
pnpm db:check
```

---

## Branch Workflow

1. Development work uses the `dev` branch
2. When ready, merge schema changes to `production`
3. Use `pnpm db:migrate` to apply migrations

### Resetting Dev Branch

To reset the dev branch to match production:

```bash
# Via Neon Console or MCP
neon branches reset dev --parent production
```
