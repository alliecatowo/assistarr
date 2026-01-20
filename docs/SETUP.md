# Assistarr Development Setup

## Prerequisites

- Node.js 20+ (managed via mise)
- pnpm 9.12+
- Access to Neon PostgreSQL database

## Quick Start

```bash
# Install tools via mise
mise install

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AUTH_SECRET` | NextAuth secret key | Yes |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway API key | Yes |
| `POSTGRES_URL` | Neon PostgreSQL connection string | Yes |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token | Optional |
| `REDIS_URL` | Redis connection for stream resumption | Optional |

## Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run linter
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio
- `pnpm test` - Run Playwright tests

## Project Structure

```
assistarr/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   └── (chat)/            # Chat interface routes
├── components/            # React components
├── lib/
│   ├── ai/               # AI configuration
│   │   ├── models.ts     # Model definitions
│   │   ├── prompts.ts    # System prompts
│   │   ├── providers.ts  # AI provider setup
│   │   └── tools/        # AI SDK tools
│   │       └── services/ # Service integrations (Radarr, Sonarr, etc.)
│   └── db/               # Database configuration
├── docs/                 # Documentation
└── public/               # Static assets
```
