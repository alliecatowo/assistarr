# Self-Hosting Assistarr

Assistarr can be self-hosted on any Linux server (Hetzner, DigitalOcean, Raspberry Pi, etc.) using Docker Compose.

## Prerequisites

- Docker 24+ and Docker Compose v2
- 1GB RAM minimum (2GB recommended)
- OpenRouter API key (or direct OpenAI/Anthropic key)

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/alliecatowo/assistarr.git
cd assistarr

# 2. Configure environment
cp .env.example .env
nano .env  # Fill in AUTH_SECRET, POSTGRES_PASSWORD, OPENROUTER_API_KEY

# 3. Start services
docker compose up -d

# 4. Open Assistarr
open http://localhost:3000
```

## Configuration

### Required Variables

| Variable | Description | How to generate |
|----------|-------------|-----------------|
| `AUTH_SECRET` | NextAuth session encryption key | `openssl rand -base64 32` |
| `POSTGRES_PASSWORD` | Database password | `openssl rand -base64 24` |
| `OPENROUTER_API_KEY` | AI provider key | [openrouter.ai/keys](https://openrouter.ai/keys) |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXTAUTH_URL` | `http://localhost:3000` | Public URL for auth callbacks |
| `ENCRYPTION_KEY` | — | Encrypts service API keys in DB |
| `ASSISTARR_PORT` | `3000` | Host port to expose |
| `REDIS_URL` | — | Enable resumable AI streams |

## Options

### With Redis (resumable AI streams)

```bash
docker compose --profile redis up -d
```

Then set `REDIS_URL=redis://redis:6379` in your `.env`.

### Using Pre-built Image

Skip the local Docker build by pulling from GHCR:

```bash
ASSISTARR_IMAGE=ghcr.io/alliecatowo/assistarr:latest docker compose up -d
```

### With Traefik Reverse Proxy

```env
# .env
TRAEFIK_ENABLED=true
ASSISTARR_DOMAIN=assistarr.yourdomain.com
```

Make sure Traefik is on the same Docker network and configured with Let's Encrypt.

### Connecting to Your Media Stack

If Radarr, Sonarr, Jellyfin, or Jellyseerr run in Docker, add their network to Assistarr so you can reference them by container name in the service settings:

```yaml
# docker-compose.yml (uncomment the network section)
networks:
  assistarr-internal:
    external:
      name: media-stack  # Your existing media stack network name
```

Then in Assistarr settings, use container hostnames:
- Radarr: `http://radarr:7878`
- Sonarr: `http://sonarr:8989`
- Jellyfin: `http://jellyfin:8096`
- Jellyseerr: `http://jellyseerr:5055`

## Updates

```bash
# Pull latest image
docker compose pull

# Or rebuild from source
docker compose build --no-cache

# Restart with new image
docker compose up -d
```

## Development

```bash
# Use the dev override (hot reload, exposed postgres)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Maintenance

```bash
# View logs
docker compose logs -f assistarr

# Database shell
docker compose exec postgres psql -U assistarr -d assistarr

# Backup database
docker compose exec postgres pg_dump -U assistarr assistarr > backup.sql

# Stop all services
docker compose down

# Stop and remove all data (⚠️ destructive)
docker compose down -v
```

## Troubleshooting

### "AUTH_SECRET is required"
Generate one: `openssl rand -base64 32` and add to `.env`.

### Services can't connect (Radarr/Sonarr unreachable)
- Make sure Assistarr is on the same Docker network as your media stack
- Use container name as hostname (not `localhost`)
- Check the service URL in Assistarr settings has no trailing slash

### Database connection errors
- Check `POSTGRES_PASSWORD` is set in `.env` (no quotes)
- Verify postgres container is healthy: `docker compose ps`

### AI not responding
- Verify your `OPENROUTER_API_KEY` has credits
- Check Assistarr logs: `docker compose logs assistarr`
