# AI tools

Each service plugin registers a set of tools the assistant can call. Tools marked **approval** ask for your confirmation before they run.

## Radarr (movies)

| Area | Tools |
|---|---|
| Find and add | search movies, add movie (approval) |
| Library | view library, edit movie (approval), delete movie (approval), refresh metadata, quality profiles, calendar |
| Downloads | trigger search, find releases, grab release (approval), queue, remove from queue (approval) |
| Import | manual import list, execute manual import (approval), scan download folder, command status |
| Files | movie files, rename files, delete movie file (approval) |
| History | history, blocklist, remove from blocklist, mark failed |

## Sonarr (TV)

Same shape as Radarr for series: search series, add series (approval), library, edit and delete (approval), refresh, quality profiles, calendar, trigger search, search all missing episodes, releases, grab (approval), queue, manual import (approval), scan, episode files, rename, delete episode file (approval), history, blocklist, mark failed, command status.

## Jellyfin

| Tool | What it does |
|---|---|
| Search media | Search titles in your library |
| Continue watching | Partially watched content |
| Recently added | Newest content |

## Jellyseerr

| Tool | What it does |
|---|---|
| Search content | Find movies and shows to request |
| Discovery | Trending and popular content |
| Get requests | Requests and their status |
| Request media | Submit a request (approval) |
| Delete request | Cancel a pending request (approval) |

## qBittorrent

| Tool | What it does |
|---|---|
| Get torrents | List and filter torrents |
| Transfer info | Global speed and data usage |
| Pause/resume torrent | Control torrent state (approval) |

The authoritative list is the `definition.ts` file in each folder under [`lib/plugins`](https://github.com/alliecatowo/assistarr/tree/main/lib/plugins).
