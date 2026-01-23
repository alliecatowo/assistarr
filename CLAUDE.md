# Assistarr - AI Media Server Assistant

## Overview

Assistarr is a Next.js 15 chat-based AI assistant for managing home media servers. It integrates with Radarr, Sonarr, Jellyfin, and Jellyseerr to help users manage their media libraries through natural conversation.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **AI**: Vercel AI SDK with multi-provider support (OpenAI, Anthropic, Google)
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS + shadcn/ui components
- **Package Manager**: pnpm

## Project Structure

```
├── app/
│   ├── (auth)/              # Authentication pages (login, register)
│   ├── (chat)/              # Main chat interface
│   │   └── api/chat/        # Chat API route (streaming)
│   └── (settings)/          # User settings pages
├── components/
│   ├── elements/            # Reusable UI elements
│   ├── message.tsx          # Chat message rendering
│   └── ...                  # Other UI components
├── lib/
│   ├── ai/
│   │   ├── prompts.ts       # System prompts for the AI
│   │   ├── providers.ts     # AI model configuration
│   │   └── tools/           # AI tool definitions
│   ├── plugins/             # Service integrations (Radarr, Sonarr, etc.)
│   └── db/                  # Database schema and queries
└── artifacts/               # Code artifact server for running Python
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/ai/prompts.ts` | System prompts that define AI behavior |
| `lib/plugins/registry.ts` | Service tool registry |
| `app/(chat)/api/chat/route.ts` | Main chat API endpoint |
| `components/message.tsx` | Message rendering with tool UI |

## Service Integrations

Services are configured per-user in settings and stored in the `ServiceConfig` table.

### Adding a New Service Tool

1. Create folder: `lib/plugins/{service-name}/`
2. Add files:
   - `client.ts` - API client with auth
   - `types.ts` - TypeScript types
   - `definition.ts` - Tool definitions export
   - `{tool-name}.ts` - Individual tool implementations
   - `index.ts` - Exports all tools
3. Register in `lib/plugins/registry.ts`
4. Add display names in `components/message.tsx` `TOOL_DISPLAY_NAMES`

### Service Client Pattern

```typescript
export async function serviceRequest<T>(
  userId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = await getServiceConfig(userId);
  // Validate config, make request, handle errors
}
```

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Database migrations
pnpm db:generate
pnpm db:migrate
```

## Common Issues

### "Not found" errors from services

1. Check baseUrl in settings (no trailing slash)
2. Verify API key is correct
3. Check server console for detailed error logs

### AI not responding after tool calls

The system prompt includes instructions to always respond after tools. If this happens, check:
- Step limit in `route.ts` (currently 8)
- System prompt in `prompts.ts`

### Tool errors showing ugly UI

Error display is handled in `components/message.tsx` in the generic tool handler section.

## Environment Variables

```env
# Required
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# AI Providers (at least one required)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=

# Optional
REDIS_URL=  # For resumable streams
```

## Visual Testing with Ladle

Assistarr uses [Ladle](https://ladle.dev) for component development and visual regression testing.

### Commands

```bash
# Start Ladle development server (component playground)
pnpm ladle

# Build Ladle for production/CI
pnpm ladle:build

# Preview built Ladle
pnpm ladle:preview

# Run visual regression tests
pnpm test:visual
```

### Writing Stories

Stories are co-located with components using the pattern `component.stories.tsx`:

```
components/ui/button.tsx
components/ui/button.stories.tsx
```

#### Basic Story Structure

```typescript
import type { Story, StoryDefault } from "@ladle/react";
import { Button } from "./button";

export default {
  title: "UI / Button",
} satisfies StoryDefault;

export const Default: Story = () => <Button>Click me</Button>;

export const Variants: Story = () => (
  <div className="flex gap-2">
    <Button variant="default">Default</Button>
    <Button variant="destructive">Destructive</Button>
  </div>
);
```

#### With Controls/Args

```typescript
export const Interactive: Story<{ label: string; disabled: boolean }> = (args) => (
  <Button disabled={args.disabled}>{args.label}</Button>
);
Interactive.args = { label: "Hello", disabled: false };
Interactive.argTypes = {
  disabled: { control: { type: "check" } },
};
```

#### With Decorators

```typescript
import { SidebarWrapper } from "@/.ladle/wrappers/sidebar-wrapper";

export const WithSidebar: Story = () => (
  <SidebarWrapper>
    <YourComponent />
  </SidebarWrapper>
);
```

### Story Meta Options

- `meta.skip: true` - Skip in visual regression tests
- `meta.desktopOnly: true` - Skip mobile viewport tests

### Visual Regression Testing

```bash
# Generate/update baseline screenshots
pnpm ladle:build
pnpm ladle:preview &
pnpm exec playwright test tests/visual/ --update-snapshots

# Run regression tests
pnpm test:visual
```

### Key Files

| File | Purpose |
|------|---------|
| `.ladle/config.mjs` | Ladle configuration |
| `.ladle/components.tsx` | Global providers (theme, Tailwind) |
| `.ladle/mocks/index.ts` | Mock data for stories |
| `tests/visual/snapshot.spec.ts` | Playwright visual tests |
