# Self-Hosting Assistarr

This guide covers deploying Assistarr on your own infrastructure using Docker.

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Docker Compose](#docker-compose)
- [Reverse Proxy Setup](#reverse-proxy-setup)
- [Media Stack Integration](#media-stack-integration)
- [Updating](#updating)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- Docker Engine 24.0+
- Docker Compose v2.20+
- An AI provider API key (OpenRouter recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/assistarr.git
cd assistarr
```

### 2. Configure Environment

Create a `.env.local` file with your configuration:

```bash
# Generate a secure secret
AUTH_SECRET=$(openssl rand -base64 32)

# Create .env.local
cat > .env.local << EOF
AUTH_SECRET=${AUTH_SECRET}
OPENROUTER_API_KEY=your-openrouter-api-key
EOF
```

### 3. Start Services

```bash
docker compose up -d
```

Assistarr will be available at `http://localhost:3000`

### 4. Create Your Account

Navigate to `http://localhost:3000` and create your account. The first user registered becomes the admin.

## Environment Variables

### Required Variables

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | Secret for session encryption. Generate with `openssl rand -base64 32` |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI capabilities. Get one at [openrouter.ai/keys](https://openrouter.ai/keys) |

### AI Provider Options

At least one AI provider must be configured:

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API key (recommended) |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key (alternative) |
| `AI_PROVIDER` | Force specific provider: `openrouter` or `gateway` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_URL` | PostgreSQL connection string | Provided by docker-compose |
| `REDIS_URL` | Redis connection string for resumable streams | Provided by docker-compose |
| `ENCRYPTION_KEY` | Key for encrypting service credentials | Auto-generated |
| `NODE_ENV` | Environment mode | `production` |

### Sentry Error Tracking (Optional)

| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | Sentry DSN for error tracking |
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side Sentry DSN |
| `SENTRY_ORG` | Sentry organization slug |
| `SENTRY_PROJECT` | Sentry project slug |

## Docker Compose

### Basic Usage

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f assistarr

# Stop all services
docker compose down

# Rebuild after updates
docker compose build --no-cache
docker compose up -d
```

### Production Configuration

For production deployments, create a `docker-compose.override.yml`:

```yaml
services:
  assistarr:
    restart: always

  postgres:
    restart: always
    environment:
      - POSTGRES_PASSWORD=use-a-strong-password-here

  redis:
    restart: always
```

### Without Redis

Redis is optional. To run without it, create `docker-compose.override.yml`:

```yaml
services:
  assistarr:
    environment:
      - REDIS_URL=
    depends_on:
      postgres:
        condition: service_healthy

  redis:
    profiles:
      - disabled
```

## Reverse Proxy Setup

### Nginx

```nginx
server {
    listen 80;
    server_name assistarr.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name assistarr.example.com;

    ssl_certificate /etc/letsencrypt/live/assistarr.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/assistarr.example.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Streaming support
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

### Traefik

Add labels to the assistarr service in `docker-compose.override.yml`:

```yaml
services:
  assistarr:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.assistarr.rule=Host(`assistarr.example.com`)"
      - "traefik.http.routers.assistarr.entrypoints=websecure"
      - "traefik.http.routers.assistarr.tls.certresolver=letsencrypt"
      - "traefik.http.services.assistarr.loadbalancer.server.port=3000"
      # Streaming support
      - "traefik.http.middlewares.assistarr-buffering.buffering.maxRequestBodyBytes=0"
      - "traefik.http.middlewares.assistarr-buffering.buffering.memRequestBodyBytes=0"
      - "traefik.http.middlewares.assistarr-buffering.buffering.maxResponseBodyBytes=0"
      - "traefik.http.middlewares.assistarr-buffering.buffering.memResponseBodyBytes=0"
      - "traefik.http.routers.assistarr.middlewares=assistarr-buffering"
    networks:
      - assistarr-network
      - traefik

networks:
  traefik:
    external: true
```

### Caddy

```caddyfile
assistarr.example.com {
    reverse_proxy localhost:3000 {
        flush_interval -1
    }
}
```

## Media Stack Integration

### Connecting to Radarr, Sonarr, Jellyfin, etc.

Assistarr needs network access to your media services. There are two approaches:

#### Option 1: Shared Network (Recommended)

If your media services run in Docker, connect Assistarr to their network:

```yaml
# docker-compose.override.yml
services:
  assistarr:
    networks:
      - assistarr-network
      - media-network  # Your existing media stack network

networks:
  media-network:
    external: true
```

Then configure services in Assistarr using their container names:
- Radarr: `http://radarr:7878`
- Sonarr: `http://sonarr:8989`
- Jellyfin: `http://jellyfin:8096`

#### Option 2: Host Network Access

For services running on the host or different machines:

```yaml
# docker-compose.override.yml
services:
  assistarr:
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

Then use `http://host.docker.internal:PORT` or the actual IP addresses.

### Service Configuration

After deployment, configure your media services in Assistarr:

1. Go to Settings > Services
2. Add each service with:
   - **Base URL**: The service address (e.g., `http://radarr:7878`)
   - **API Key**: Found in each service's settings

## Updating

### Standard Update

```bash
cd assistarr
git pull
docker compose build --no-cache
docker compose up -d
```

### Database Migrations

Migrations run automatically on startup. If you need to run them manually:

```bash
docker compose exec assistarr npx tsx lib/db/migrate.ts
```

### Backup Before Update

```bash
# Backup database
docker compose exec postgres pg_dump -U assistarr assistarr > backup.sql

# Backup volumes
docker run --rm -v assistarr_postgres_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/postgres-backup.tar.gz /data
```

## Troubleshooting

### Check Service Health

```bash
# Application health
curl http://localhost:3000/api/health

# Container status
docker compose ps

# View logs
docker compose logs -f assistarr
```

### Common Issues

#### Database Connection Failed

```bash
# Check PostgreSQL is running
docker compose logs postgres

# Test connection
docker compose exec postgres psql -U assistarr -d assistarr -c "SELECT 1"
```

#### AI Provider Errors

Verify your API key is set correctly:

```bash
docker compose exec assistarr printenv | grep -E "(OPENROUTER|AI_)"
```

#### Services Not Reachable

1. Verify network connectivity:
   ```bash
   docker compose exec assistarr curl -v http://radarr:7878/api
   ```

2. Check your service URLs don't have trailing slashes

3. Verify API keys are correct in Settings > Services

#### Container Won't Start

```bash
# Check for errors
docker compose logs assistarr

# Verify environment variables
docker compose config
```

### Reset Everything

```bash
# Stop and remove everything
docker compose down -v

# Start fresh
docker compose up -d
```

### Support

- GitHub Issues: Report bugs and request features
- Documentation: Check `/docs` for architecture details
