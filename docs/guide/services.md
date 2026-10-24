# Connecting your services

Service connections are per user. After logging in, open **Settings** and add each service.

| Service | You provide |
|---|---|
| Radarr | Server URL and API key |
| Sonarr | Server URL and API key |
| Jellyfin | Server URL and authentication token |
| Jellyseerr | Server URL and API key |
| qBittorrent | WebUI URL and credentials |

Use URLs reachable from the Assistarr server (container names inside Docker, not `localhost`). Credentials are stored encrypted with `ENCRYPTION_KEY`. See [AI tools](/reference/tools) for what the assistant can do with each service.
