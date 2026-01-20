# Assistarr

AI-powered home media server management interface.

## Features

- **Radarr Integration** - Manage your movie collection with AI assistance
- **Sonarr Integration** - Handle TV show downloads and organization
- **Jellyfin Integration** - Control your media server playback and library
- **Jellyseerr Integration** - Process media requests with natural language

## Tech Stack

- [Next.js](https://nextjs.org) - React framework with App Router
- [AI SDK](https://ai-sdk.dev) - Unified API for LLM interactions
- [shadcn/ui](https://ui.shadcn.com) - UI components with Tailwind CSS
- [Neon Serverless Postgres](https://neon.tech) - Database for chat history and user data
- [Auth.js](https://authjs.dev) - Authentication

## Quick Start

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Run database migrations:
   ```bash
   pnpm db:migrate
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

See `.env.example` for required environment variables including:
- Database connection string
- Authentication provider credentials
- AI Gateway API key (for non-Vercel deployments)
- Media server API keys (Radarr, Sonarr, Jellyfin, Jellyseerr)
