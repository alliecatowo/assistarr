# qBittorrent Web API Reference

This document covers the qBittorrent Web API v2 (qBittorrent 4.1+) endpoints relevant for a chat assistant integration.

---

## Overview

qBittorrent provides a RESTful Web API that allows external applications to control the BitTorrent client. The API uses cookie-based session authentication.

### Base URL Format

```
http://{host}:{port}/api/v2/{endpoint}
```

**Default Ports:**
- qBittorrent Web UI: `8080`

**Examples:**
- Local: `http://localhost:8080/api/v2/`
- Network: `http://192.168.1.100:8080/api/v2/`

---

## Authentication

qBittorrent uses cookie-based session authentication. You must authenticate first and include the session cookie (`SID`) in all subsequent requests.

### Login

**Endpoint:** `POST /api/v2/auth/login`

**Content-Type:** `application/x-www-form-urlencoded`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | Web UI username |
| `password` | string | Yes | Web UI password |

**Request Example:**

```typescript
const response = await fetch(`${baseUrl}/api/v2/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    username: 'admin',
    password: 'adminadmin',
  }),
  credentials: 'include', // Important for cookies
});
```

**Response:**
- **Success (200):** `Ok.` - The `SID` cookie is set in the response headers
- **Failure (200):** `Fails.` - Invalid credentials
- **Banned (403):** Too many failed attempts (IP banned)

**Session Cookie:**

The response includes a `Set-Cookie` header with the session ID:
```
Set-Cookie: SID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx; path=/
```

Store this cookie and include it in all subsequent requests.

### Logout

**Endpoint:** `POST /api/v2/auth/logout`

**Request Example:**

```typescript
await fetch(`${baseUrl}/api/v2/auth/logout`, {
  method: 'POST',
  headers: {
    'Cookie': `SID=${sessionId}`,
  },
});
```

**Response:** `200 OK`

---

## Global Transfer Information

### Get Global Transfer Info

Returns current global download/upload speeds and session statistics.

**Endpoint:** `GET /api/v2/transfer/info`

**Request Example:**

```typescript
const response = await fetch(`${baseUrl}/api/v2/transfer/info`, {
  headers: {
    'Cookie': `SID=${sessionId}`,
  },
});
const transferInfo = await response.json();
```

**Response Example:**

```json
{
  "dl_info_speed": 9681262,
  "dl_info_data": 236859683645,
  "up_info_speed": 0,
  "up_info_data": 1012527,
  "dl_rate_limit": 0,
  "up_rate_limit": 0,
  "dht_nodes": 0,
  "connection_status": "connected"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `dl_info_speed` | integer | Global download rate (bytes/second) |
| `dl_info_data` | integer | Total data downloaded this session (bytes) |
| `up_info_speed` | integer | Global upload rate (bytes/second) |
| `up_info_data` | integer | Total data uploaded this session (bytes) |
| `dl_rate_limit` | integer | Download rate limit (bytes/second), 0 = unlimited |
| `up_rate_limit` | integer | Upload rate limit (bytes/second), 0 = unlimited |
| `dht_nodes` | integer | DHT nodes connected |
| `connection_status` | string | `connected`, `firewalled`, or `disconnected` |

### Get Speed Limits Mode

**Endpoint:** `GET /api/v2/transfer/speedLimitsMode`

**Response:** `1` if alternative speed limits are enabled, `0` otherwise.

### Toggle Speed Limits Mode

**Endpoint:** `POST /api/v2/transfer/toggleSpeedLimitsMode`

Toggles between normal and alternative speed limits.

---

## Torrent Management

### Get Torrent List

**Endpoint:** `GET /api/v2/torrents/info`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `filter` | string | Filter torrents: `all`, `downloading`, `seeding`, `completed`, `paused`, `active`, `inactive`, `resumed`, `stalled`, `stalled_uploading`, `stalled_downloading`, `errored` |
| `category` | string | Filter by category |
| `tag` | string | Filter by tag |
| `sort` | string | Sort by field (e.g., `name`, `size`, `progress`, `dlspeed`, `upspeed`, `priority`, `added_on`) |
| `reverse` | boolean | Reverse sort order |
| `limit` | integer | Limit number of results |
| `offset` | integer | Offset for pagination |
| `hashes` | string | Filter by torrent hashes (pipe-separated) |

**Request Example:**

```typescript
// Get all downloading torrents
const response = await fetch(`${baseUrl}/api/v2/torrents/info?filter=downloading`, {
  headers: {
    'Cookie': `SID=${sessionId}`,
  },
});
const torrents = await response.json();
```

**Response Example:**

```json
[
  {
    "added_on": 1693761234,
    "amount_left": 0,
    "auto_tmm": false,
    "availability": -1,
    "category": "movies",
    "completed": 4294967296,
    "completion_on": 1693771234,
    "content_path": "/downloads/Movie.Name.2023.1080p",
    "dl_limit": -1,
    "dlspeed": 0,
    "downloaded": 4294967296,
    "downloaded_session": 0,
    "eta": 8640000,
    "f_l_piece_prio": false,
    "force_start": false,
    "hash": "8c212779b4abde7c6bc608571cffc845480a6e00",
    "infohash_v1": "8c212779b4abde7c6bc608571cffc845480a6e00",
    "infohash_v2": "",
    "last_activity": 1693771234,
    "magnet_uri": "magnet:?xt=urn:btih:...",
    "max_ratio": -1,
    "max_seeding_time": -1,
    "name": "Movie.Name.2023.1080p.BluRay.x264",
    "num_complete": 50,
    "num_incomplete": 10,
    "num_leechs": 0,
    "num_seeds": 0,
    "priority": 1,
    "progress": 1,
    "ratio": 0,
    "ratio_limit": -2,
    "save_path": "/downloads/",
    "seeding_time": 0,
    "seeding_time_limit": -2,
    "seen_complete": 1693771234,
    "seq_dl": false,
    "size": 4294967296,
    "state": "pausedUP",
    "super_seeding": false,
    "tags": "",
    "time_active": 10000,
    "total_size": 4294967296,
    "tracker": "udp://tracker.example.com:6969",
    "trackers_count": 5,
    "up_limit": -1,
    "uploaded": 0,
    "uploaded_session": 0,
    "upspeed": 0
  }
]
```

**Key Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `hash` | string | Torrent hash (unique identifier) |
| `name` | string | Torrent name |
| `size` | integer | Total size (bytes) |
| `progress` | float | Download progress (0.0 to 1.0) |
| `dlspeed` | integer | Download speed (bytes/second) |
| `upspeed` | integer | Upload speed (bytes/second) |
| `eta` | integer | Estimated time remaining (seconds), 8640000 = infinity |
| `state` | string | Torrent state (see states below) |
| `category` | string | Category name |
| `save_path` | string | Download location |
| `added_on` | integer | Unix timestamp when added |
| `completion_on` | integer | Unix timestamp when completed |
| `amount_left` | integer | Bytes remaining to download |
| `downloaded` | integer | Total bytes downloaded |
| `uploaded` | integer | Total bytes uploaded |
| `ratio` | float | Share ratio |

**Torrent States:**

| State | Description |
|-------|-------------|
| `error` | Error occurred |
| `missingFiles` | Torrent data files are missing |
| `uploading` | Seeding and data is being transferred |
| `pausedUP` | Seeding, paused |
| `queuedUP` | Queued for seeding |
| `stalledUP` | Seeding but no connection |
| `checkingUP` | Checking files before seeding |
| `forcedUP` | Forced seeding (ignore queue) |
| `allocating` | Allocating disk space |
| `downloading` | Downloading and transferring data |
| `metaDL` | Downloading metadata |
| `pausedDL` | Downloading, paused |
| `queuedDL` | Queued for download |
| `stalledDL` | Downloading but stalled |
| `checkingDL` | Checking files before downloading |
| `forcedDL` | Forced downloading (ignore queue) |
| `checkingResumeData` | Checking resume data |
| `moving` | Moving files to final location |
| `unknown` | Unknown status |

### Get Torrent Properties

**Endpoint:** `GET /api/v2/torrents/properties`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hash` | string | Yes | Torrent hash |

**Request Example:**

```typescript
const response = await fetch(
  `${baseUrl}/api/v2/torrents/properties?hash=${torrentHash}`,
  {
    headers: {
      'Cookie': `SID=${sessionId}`,
    },
  }
);
const properties = await response.json();
```

**Response Example:**

```json
{
  "save_path": "/downloads/",
  "creation_date": 1693761234,
  "piece_size": 16777216,
  "comment": "Torrent comment",
  "total_wasted": 0,
  "total_uploaded": 0,
  "total_uploaded_session": 0,
  "total_downloaded": 4294967296,
  "total_downloaded_session": 0,
  "up_limit": -1,
  "dl_limit": -1,
  "time_elapsed": 10000,
  "seeding_time": 0,
  "nb_connections": 0,
  "nb_connections_limit": 100,
  "share_ratio": 0,
  "addition_date": 1693761234,
  "completion_date": 1693771234,
  "created_by": "qBittorrent",
  "dl_speed_avg": 429496,
  "dl_speed": 0,
  "eta": 8640000,
  "last_seen": 1693771234,
  "peers": 0,
  "peers_total": 10,
  "pieces_have": 256,
  "pieces_num": 256,
  "reannounce": 0,
  "seeds": 0,
  "seeds_total": 50,
  "total_size": 4294967296,
  "up_speed": 0,
  "up_speed_avg": 0
}
```

### Get Torrent Files

**Endpoint:** `GET /api/v2/torrents/files`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hash` | string | Yes | Torrent hash |

**Response Example:**

```json
[
  {
    "index": 0,
    "name": "Movie.Name.2023.1080p.BluRay.x264/movie.mkv",
    "size": 4294967296,
    "progress": 1,
    "priority": 1,
    "is_seed": true,
    "piece_range": [0, 255],
    "availability": 1
  }
]
```

---

## Torrent Control

### Pause Torrents

**Endpoint:** `POST /api/v2/torrents/pause`

**Content-Type:** `application/x-www-form-urlencoded`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hashes` | string | Yes | Torrent hashes separated by `\|` or `all` |

**Request Example:**

```typescript
// Pause specific torrents
await fetch(`${baseUrl}/api/v2/torrents/pause`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': `SID=${sessionId}`,
  },
  body: new URLSearchParams({
    hashes: 'hash1|hash2|hash3',
  }),
});

// Pause all torrents
await fetch(`${baseUrl}/api/v2/torrents/pause`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': `SID=${sessionId}`,
  },
  body: new URLSearchParams({
    hashes: 'all',
  }),
});
```

**Response:** `200 OK`

### Resume Torrents

**Endpoint:** `POST /api/v2/torrents/resume`

**Content-Type:** `application/x-www-form-urlencoded`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hashes` | string | Yes | Torrent hashes separated by `\|` or `all` |

**Request Example:**

```typescript
// Resume specific torrents
await fetch(`${baseUrl}/api/v2/torrents/resume`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': `SID=${sessionId}`,
  },
  body: new URLSearchParams({
    hashes: 'hash1|hash2|hash3',
  }),
});

// Resume all torrents
await fetch(`${baseUrl}/api/v2/torrents/resume`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': `SID=${sessionId}`,
  },
  body: new URLSearchParams({
    hashes: 'all',
  }),
});
```

**Response:** `200 OK`

### Delete Torrents

**Endpoint:** `POST /api/v2/torrents/delete`

**Content-Type:** `application/x-www-form-urlencoded`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hashes` | string | Yes | Torrent hashes separated by `\|` or `all` |
| `deleteFiles` | boolean | Yes | If `true`, also delete downloaded files |

**Request Example:**

```typescript
await fetch(`${baseUrl}/api/v2/torrents/delete`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': `SID=${sessionId}`,
  },
  body: new URLSearchParams({
    hashes: torrentHash,
    deleteFiles: 'false',
  }),
});
```

**Response:** `200 OK`

### Recheck Torrents

**Endpoint:** `POST /api/v2/torrents/recheck`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hashes` | string | Yes | Torrent hashes separated by `\|` or `all` |

### Reannounce Torrents

**Endpoint:** `POST /api/v2/torrents/reannounce`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hashes` | string | Yes | Torrent hashes separated by `\|` or `all` |

---

## Adding Torrents

### Add Torrent via URL/Magnet

**Endpoint:** `POST /api/v2/torrents/add`

**Content-Type:** `multipart/form-data` or `application/x-www-form-urlencoded`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `urls` | string | Yes* | Newline-separated URLs or magnet links |
| `torrents` | file | Yes* | Torrent file(s) |
| `savepath` | string | No | Download path |
| `cookie` | string | No | Cookie for URL downloads |
| `category` | string | No | Category name |
| `tags` | string | No | Comma-separated tags |
| `skip_checking` | boolean | No | Skip hash checking |
| `paused` | boolean | No | Add in paused state |
| `root_folder` | boolean | No | Create root folder |
| `rename` | string | No | Rename torrent |
| `upLimit` | integer | No | Upload limit (bytes/s) |
| `dlLimit` | integer | No | Download limit (bytes/s) |
| `ratioLimit` | float | No | Ratio limit |
| `seedingTimeLimit` | integer | No | Seeding time limit (minutes) |
| `autoTMM` | boolean | No | Automatic torrent management |
| `sequentialDownload` | boolean | No | Enable sequential download |
| `firstLastPiecePrio` | boolean | No | Prioritize first/last pieces |

*At least one of `urls` or `torrents` is required.

**Request Example (Magnet):**

```typescript
await fetch(`${baseUrl}/api/v2/torrents/add`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': `SID=${sessionId}`,
  },
  body: new URLSearchParams({
    urls: 'magnet:?xt=urn:btih:...',
    category: 'movies',
    paused: 'false',
  }),
});
```

**Response:**
- **Success:** `200 OK` with `Ok.`
- **Failure:** `200 OK` with `Fails.`

---

## Application Info

### Get Application Version

**Endpoint:** `GET /api/v2/app/version`

**Response:** Application version string (e.g., `v4.6.2`)

### Get API Version

**Endpoint:** `GET /api/v2/app/webapiVersion`

**Response:** API version string (e.g., `2.9.3`)

### Get Build Info

**Endpoint:** `GET /api/v2/app/buildInfo`

**Response Example:**

```json
{
  "qt": "6.5.2",
  "libtorrent": "2.0.9.0",
  "boost": "1.82.0",
  "openssl": "3.1.2",
  "zlib": "1.2.13",
  "bitness": 64
}
```

### Get Default Save Path

**Endpoint:** `GET /api/v2/app/defaultSavePath`

**Response:** Default save path string (e.g., `/downloads/`)

### Get Preferences

**Endpoint:** `GET /api/v2/app/preferences`

Returns all application preferences. Useful for getting disk usage info.

**Response (partial):**

```json
{
  "save_path": "/downloads/",
  "temp_path_enabled": false,
  "temp_path": "/downloads/temp/",
  "scan_dirs": {},
  "export_dir": "",
  "export_dir_fin": "",
  "mail_notification_enabled": false,
  "autorun_enabled": false,
  "preallocate_all": false,
  "incomplete_files_ext": false,
  "auto_tmm_enabled": true,
  "torrent_changed_tmm_enabled": true,
  "save_path_changed_tmm_enabled": false,
  "category_changed_tmm_enabled": false,
  "...": "..."
}
```

---

## Sync (Main Data)

### Get Sync Main Data

Get all data needed to sync the UI. More efficient than multiple calls.

**Endpoint:** `GET /api/v2/sync/maindata`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `rid` | integer | Response ID from previous call (for incremental updates) |

**Response Example:**

```json
{
  "rid": 1,
  "full_update": true,
  "torrents": {
    "hash1": { "...torrent data..." },
    "hash2": { "...torrent data..." }
  },
  "torrents_removed": [],
  "categories": {
    "movies": { "name": "movies", "savePath": "/downloads/movies/" },
    "tv": { "name": "tv", "savePath": "/downloads/tv/" }
  },
  "categories_removed": [],
  "tags": ["hd", "4k"],
  "tags_removed": [],
  "server_state": {
    "alltime_dl": 236859683645,
    "alltime_ul": 1012527,
    "average_time_queue": 0,
    "connection_status": "connected",
    "dht_nodes": 0,
    "dl_info_data": 236859683645,
    "dl_info_speed": 9681262,
    "dl_rate_limit": 0,
    "free_space_on_disk": 523986542592,
    "global_ratio": "0.00",
    "queued_io_jobs": 0,
    "queueing": true,
    "read_cache_hits": "0.00",
    "read_cache_overload": "0.00",
    "refresh_interval": 1500,
    "total_buffers_size": 0,
    "total_peer_connections": 0,
    "total_queued_size": 0,
    "total_wasted_session": 0,
    "up_info_data": 1012527,
    "up_info_speed": 0,
    "up_rate_limit": 0,
    "use_alt_speed_limits": false,
    "write_cache_overload": "0.00"
  }
}
```

**Important Fields in `server_state`:**

| Field | Type | Description |
|-------|------|-------------|
| `free_space_on_disk` | integer | Available disk space (bytes) |
| `dl_info_speed` | integer | Current download speed (bytes/s) |
| `up_info_speed` | integer | Current upload speed (bytes/s) |
| `connection_status` | string | Connection status |
| `use_alt_speed_limits` | boolean | Alternative speed limits enabled |

---

## Categories

### Get Categories

**Endpoint:** `GET /api/v2/torrents/categories`

**Response Example:**

```json
{
  "movies": {
    "name": "movies",
    "savePath": "/downloads/movies/"
  },
  "tv": {
    "name": "tv",
    "savePath": "/downloads/tv/"
  }
}
```

### Create Category

**Endpoint:** `POST /api/v2/torrents/createCategory`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | Yes | Category name |
| `savePath` | string | No | Save path for category |

---

## Integration with Radarr/Sonarr

Radarr and Sonarr integrate with qBittorrent as a download client. Here's how they interact:

### How Radarr/Sonarr Use qBittorrent

1. **Adding Downloads:** Radarr/Sonarr send magnet links or torrent files to qBittorrent via `/api/v2/torrents/add`
2. **Monitoring Progress:** They poll `/api/v2/torrents/info` to check download status
3. **Category Management:** Downloads are assigned categories like `radarr` or `sonarr`
4. **Completed Handling:** When a torrent completes, Radarr/Sonarr import the files and optionally remove the torrent

### Radarr/Sonarr Settings

In Radarr/Sonarr, the qBittorrent download client configuration requires:

| Setting | Description |
|---------|-------------|
| Host | qBittorrent hostname/IP |
| Port | Web UI port (default: 8080) |
| Username | Web UI username |
| Password | Web UI password |
| Category | Category for downloads (e.g., `radarr`, `sonarr`) |
| Remove Completed | Whether to remove torrents after import |

### Typical Workflow

```
1. User requests movie/show in Radarr/Sonarr
2. Radarr/Sonarr finds release and sends to qBittorrent
3. qBittorrent downloads the content
4. Radarr/Sonarr monitors progress via API
5. On completion, Radarr/Sonarr imports to media library
6. Optionally removes completed torrent from qBittorrent
```

---

## TypeScript Client Example

Here's a basic TypeScript client for qBittorrent:

```typescript
class QBittorrentClient {
  private baseUrl: string;
  private sessionId: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async login(username: string, password: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/api/v2/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ username, password }),
    });

    const text = await response.text();
    if (text === 'Ok.') {
      // Extract SID from Set-Cookie header
      const cookie = response.headers.get('set-cookie');
      if (cookie) {
        const match = cookie.match(/SID=([^;]+)/);
        if (match) {
          this.sessionId = match[1];
          return true;
        }
      }
    }
    return false;
  }

  private getHeaders(): HeadersInit {
    if (!this.sessionId) {
      throw new Error('Not authenticated');
    }
    return {
      'Cookie': `SID=${this.sessionId}`,
    };
  }

  async getTransferInfo(): Promise<TransferInfo> {
    const response = await fetch(`${this.baseUrl}/api/v2/transfer/info`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async getTorrents(filter?: string): Promise<Torrent[]> {
    const url = new URL(`${this.baseUrl}/api/v2/torrents/info`);
    if (filter) {
      url.searchParams.set('filter', filter);
    }
    const response = await fetch(url.toString(), {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async pauseTorrents(hashes: string[] | 'all'): Promise<void> {
    await fetch(`${this.baseUrl}/api/v2/torrents/pause`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        hashes: Array.isArray(hashes) ? hashes.join('|') : 'all',
      }),
    });
  }

  async resumeTorrents(hashes: string[] | 'all'): Promise<void> {
    await fetch(`${this.baseUrl}/api/v2/torrents/resume`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        hashes: Array.isArray(hashes) ? hashes.join('|') : 'all',
      }),
    });
  }

  async getMainData(rid?: number): Promise<SyncMainData> {
    const url = new URL(`${this.baseUrl}/api/v2/sync/maindata`);
    if (rid !== undefined) {
      url.searchParams.set('rid', rid.toString());
    }
    const response = await fetch(url.toString(), {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async getFreeSpace(): Promise<number> {
    const mainData = await this.getMainData();
    return mainData.server_state.free_space_on_disk;
  }
}

// Type definitions
interface TransferInfo {
  dl_info_speed: number;
  dl_info_data: number;
  up_info_speed: number;
  up_info_data: number;
  dl_rate_limit: number;
  up_rate_limit: number;
  dht_nodes: number;
  connection_status: string;
}

interface Torrent {
  hash: string;
  name: string;
  size: number;
  progress: number;
  dlspeed: number;
  upspeed: number;
  eta: number;
  state: string;
  category: string;
  save_path: string;
  added_on: number;
  completion_on: number;
  amount_left: number;
  downloaded: number;
  uploaded: number;
  ratio: number;
}

interface SyncMainData {
  rid: number;
  full_update: boolean;
  torrents: Record<string, Partial<Torrent>>;
  torrents_removed: string[];
  server_state: {
    free_space_on_disk: number;
    dl_info_speed: number;
    up_info_speed: number;
    connection_status: string;
    use_alt_speed_limits: boolean;
    [key: string]: unknown;
  };
}
```

---

## Chat Assistant Integration Examples

### Get Download Status Summary

```typescript
async function getDownloadSummary(client: QBittorrentClient): Promise<string> {
  const [transferInfo, torrents] = await Promise.all([
    client.getTransferInfo(),
    client.getTorrents('downloading'),
  ]);

  const downloadSpeed = formatBytes(transferInfo.dl_info_speed) + '/s';
  const uploadSpeed = formatBytes(transferInfo.up_info_speed) + '/s';

  let summary = `Download: ${downloadSpeed} | Upload: ${uploadSpeed}\n\n`;

  if (torrents.length === 0) {
    summary += 'No active downloads.';
  } else {
    summary += `Active downloads (${torrents.length}):\n`;
    for (const torrent of torrents.slice(0, 5)) {
      const progress = (torrent.progress * 100).toFixed(1);
      const speed = formatBytes(torrent.dlspeed) + '/s';
      const eta = formatEta(torrent.eta);
      summary += `- ${torrent.name}: ${progress}% @ ${speed} (ETA: ${eta})\n`;
    }
  }

  return summary;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatEta(seconds: number): string {
  if (seconds >= 8640000) return '~';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
```

### Check Disk Space

```typescript
async function checkDiskSpace(client: QBittorrentClient): Promise<string> {
  const freeSpace = await client.getFreeSpace();
  const freeGB = (freeSpace / (1024 ** 3)).toFixed(2);
  return `Free disk space: ${freeGB} GB`;
}
```

---

## Service Configuration

To add qBittorrent to the Assistarr ServiceConfig:

| Field | Value |
|-------|-------|
| `serviceName` | `qbittorrent` |
| `baseUrl` | `http://localhost:8080` |
| `apiKey` | `username:password` (stored as base64 or plain) |

**Note:** qBittorrent uses username/password authentication instead of an API key. Store credentials securely.

---

## Error Handling

| HTTP Status | Meaning |
|-------------|---------|
| 200 | Success |
| 401 | Unauthorized (session expired) |
| 403 | Forbidden (IP banned) |
| 404 | Not found (invalid endpoint) |
| 409 | Conflict (operation cannot be performed) |

**Common Issues:**

1. **Session Expiry:** Sessions can expire after inactivity. Re-authenticate if you get 401.
2. **IP Ban:** Too many failed login attempts result in a 403. Wait or restart qBittorrent.
3. **CSRF Protection:** Some endpoints require the `Referer` header to match the host.

---

## References

- qBittorrent Wiki: https://github.com/qbittorrent/qBittorrent/wiki
- Web API Documentation: https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-4.1)
