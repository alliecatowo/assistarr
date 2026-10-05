# Development

Stack: Next.js 16 (App Router), React 19, Vercel AI SDK, NextAuth, Drizzle ORM on Postgres, Tailwind CSS 4 and shadcn/ui, pnpm, Biome.

## Commands

```bash
make dev              # Next.js dev server
make dev-docker       # docker compose with hot reload
make build            # production build
make lint             # Biome
make format
make db-migrate       # run migrations
make db-generate      # generate migrations from schema changes
make db-studio        # Drizzle Studio
make test-unit        # Vitest
make test-e2e         # Playwright
make test-coverage
```

Run `make help` for the full list.

## Layout

```
app/        (auth), (chat) with the streaming chat API route, (settings)
components/ UI and message rendering
lib/ai/     prompts.ts, providers.ts, tools/
lib/plugins/ one folder per service (radarr, sonarr, jellyfin, jellyseerr, qbittorrent, core)
lib/db/     Drizzle schema and queries
```

## Adding a service

1. Create `lib/plugins/<service>/`.
2. Add `client.ts` (API client), `types.ts`, `schemas.ts`, one file per tool, and `definition.ts` declaring the tools (set `requiresApproval: true` for anything state-changing).
3. Export from `index.ts` and register the service in `lib/plugins/registry.ts`.

More engineering notes live in the repository's [docs folder](https://github.com/alliecatowo/assistarr/tree/main/docs) and in [CONTRIBUTING.md](https://github.com/alliecatowo/assistarr/blob/main/CONTRIBUTING.md).
