# Self-hosting with Docker

Assistarr runs on any Linux host with Docker 24+ and Compose v2. Plan for 1 GB of RAM at minimum, 2 GB recommended.

## Quick start

```bash
git clone https://github.com/alliecatowo/assistarr.git
cd assistarr
cp .env.example .env
# fill in AUTH_SECRET, POSTGRES_PASSWORD and an AI provider key (for example OPENROUTER_API_KEY)
docker compose up -d
```

Then open `http://localhost:3000`. The image is built locally from the repository `Dockerfile`.

## Options

### Redis for resumable streams

```bash
docker compose --profile redis up -d
```

Then set `REDIS_URL=redis://redis:6379` in `.env`.

### Traefik

```ini
TRAEFIK_ENABLED=true
ASSISTARR_DOMAIN=assistarr.yourdomain.com
```

Traefik must share a Docker network with Assistarr and be configured for Let's Encrypt.

### Reaching your media stack

If Radarr, Sonarr, Jellyfin or Jellyseerr run in Docker, attach Assistarr to their network by uncommenting the `networks` section in `docker-compose.yml` and pointing it at your existing network name (for example `media-stack`). Then use container hostnames in Settings:

- Radarr `http://radarr:7878`
- Sonarr `http://sonarr:8989`
- Jellyfin `http://jellyfin:8096`
- Jellyseerr `http://jellyseerr:5055`

## Updating

```bash
git pull
docker compose build --no-cache
docker compose up -d
```

## Maintenance

```bash
docker compose logs -f assistarr
docker compose exec postgres psql -U assistarr -d assistarr
docker compose exec postgres pg_dump -U assistarr assistarr > backup.sql
docker compose down          # keep data
docker compose down -v       # deletes the database volume
```

## Troubleshooting

**"AUTH_SECRET is required"**: generate one with `openssl rand -base64 32` and add it to `.env`.

**Radarr or Sonarr unreachable**: put Assistarr on the same Docker network, use the container name instead of `localhost`, and leave no trailing slash on the URL.

**Database connection errors**: check `POSTGRES_PASSWORD` is set without quotes, and that `docker compose ps` shows Postgres healthy.

**AI not responding**: confirm your provider key has credit and read `docker compose logs assistarr`.
