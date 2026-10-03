# Configuration

Copy `.env.example` to `.env.local` (from source) or `.env` (Docker). The file documents every variable.

## Required

| Variable | Description |
|---|---|
| `AUTH_SECRET` | Session encryption secret. Generate with `openssl rand -base64 32`. |
| `POSTGRES_URL` (source) or `POSTGRES_PASSWORD` (Docker) | Database connection. Docker builds the URL from `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB`. |
| An AI provider key | `OPENROUTER_API_KEY` or `AI_GATEWAY_API_KEY`. Direct `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` and `GOOGLE_GENERATIVE_AI_API_KEY` are also supported. |

## Optional

| Variable | Description |
|---|---|
| `ENCRYPTION_KEY` | Encrypts service credentials stored in the database. Changing it makes existing encrypted service configs unreadable. |
| `ALLOW_PRIVATE_SERVICE_URLS` | Set `true` to let users point services and MCP servers at private addresses (localhost, LAN, container names). Required for most self-hosting; the Docker compose file defaults it to `true`. Link-local/cloud-metadata addresses are always blocked. Leave `false` on shared or public deployments. |
| `REDIS_URL` | Enables resumable AI streams. |
| `NEXTAUTH_URL` | Public URL, if not `http://localhost:3000`. |
| `ASSISTARR_PORT` | Host port in Docker (default `3000`). |
| `TRAEFIK_ENABLED`, `ASSISTARR_DOMAIN` | Traefik labels. |

## AI provider selection

Assistarr defaults to OpenRouter when `OPENROUTER_API_KEY` is set and falls back to the Vercel AI Gateway otherwise. Direct OpenAI, Anthropic and Google providers are available as well.
