# Sonarr API v3 Documentation

This document provides comprehensive API documentation for Sonarr v3, focused on endpoints useful for the Assistarr chat assistant.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL Format](#base-url-format)
- [Rate Limiting](#rate-limiting)
- [Common Response Patterns](#common-response-patterns)
- [Key Endpoints](#key-endpoints)
  - [Series Lookup/Search](#series-lookupsearch)
  - [Series Management](#series-management)
  - [Episode Management](#episode-management)
  - [Queue](#queue)
  - [Calendar](#calendar)
  - [Quality Profiles](#quality-profiles)
  - [Root Folders](#root-folders)
  - [System](#system)
- [Error Handling](#error-handling)
- [Webhook Support](#webhook-support)

---

## Overview

Sonarr is a PVR (Personal Video Recorder) for Usenet and BitTorrent users that monitors RSS feeds for new episodes of TV shows and automatically downloads, sorts, and renames them.

The Sonarr API v3 provides full programmatic access to all Sonarr functionality. All endpoints return JSON and accept JSON for request bodies.

**API Version**: v3
**Base Path**: `/api/v3`

---

## Authentication

Sonarr uses API key authentication. The API key can be found in:

**Settings > General > Security > API Key**

### Authentication Methods

There are two ways to authenticate requests:

#### 1. Header Authentication (Recommended)

```http
X-Api-Key: your-api-key-here
```

#### 2. Query Parameter Authentication

```
?apikey=your-api-key-here
```

### Example Request with Header Auth

```bash
curl -X GET "https://sonarr.example.com/api/v3/series" \
  -H "X-Api-Key: your-api-key-here" \
  -H "Content-Type: application/json"
```

---

## Base URL Format

```
{protocol}://{hostname}:{port}/api/v3/{endpoint}
```

### Examples

```
https://sonarr.allisons.dev/api/v3/series
http://localhost:8989/api/v3/series/lookup
```

### Common Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://sonarr.allisons.dev/api/v3` |
| Local Default | `http://localhost:8989/api/v3` |
| Docker Default | `http://sonarr:8989/api/v3` |

---

## Rate Limiting

Sonarr does not implement explicit rate limiting at the API level. However:

- **Best Practice**: Limit requests to 1-2 per second for bulk operations
- **Batch Operations**: Use bulk endpoints where available
- **Polling**: For queue/calendar, poll no more than every 30-60 seconds
- **Search Operations**: Avoid rapid successive searches

---

## Common Response Patterns

### Success Response

```json
{
  "id": 1,
  "title": "Series Name",
  // ... additional fields
}
```

### Array Response

```json
[
  { "id": 1, "title": "Series 1" },
  { "id": 2, "title": "Series 2" }
]
```

### Error Response

```json
{
  "message": "Error description",
  "description": "Detailed error information"
}
```

---

## Key Endpoints

### Series Lookup/Search

Search for TV series by name using TheTVDB and other sources.

#### `GET /api/v3/series/lookup`

Search for series to add to your library.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `term` | string | Yes | Search query (series name) |

**Example Request:**

```bash
curl -X GET "https://sonarr.example.com/api/v3/series/lookup?term=breaking%20bad" \
  -H "X-Api-Key: your-api-key"
```

**Example Response:**

```json
[
  {
    "title": "Breaking Bad",
    "sortTitle": "breaking bad",
    "status": "ended",
    "ended": true,
    "overview": "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine...",
    "network": "AMC",
    "airTime": "21:00",
    "images": [
      {
        "coverType": "poster",
        "url": "/MediaCover/series/1/poster.jpg",
        "remoteUrl": "https://artworks.thetvdb.com/banners/posters/81189-1.jpg"
      },
      {
        "coverType": "fanart",
        "url": "/MediaCover/series/1/fanart.jpg",
        "remoteUrl": "https://artworks.thetvdb.com/banners/fanart/original/81189-1.jpg"
      }
    ],
    "remotePoster": "https://artworks.thetvdb.com/banners/posters/81189-1.jpg",
    "seasons": [
      {
        "seasonNumber": 0,
        "monitored": false
      },
      {
        "seasonNumber": 1,
        "monitored": true
      },
      {
        "seasonNumber": 2,
        "monitored": true
      }
    ],
    "year": 2008,
    "qualityProfileId": 0,
    "languageProfileId": 0,
    "seasonFolder": true,
    "monitored": true,
    "useSceneNumbering": false,
    "runtime": 60,
    "tvdbId": 81189,
    "tvRageId": 18164,
    "tvMazeId": 169,
    "firstAired": "2008-01-20T00:00:00Z",
    "seriesType": "standard",
    "cleanTitle": "breakingbad",
    "imdbId": "tt0903747",
    "titleSlug": "breaking-bad",
    "certification": "TV-MA",
    "genres": ["Crime", "Drama", "Suspense", "Thriller"],
    "tags": [],
    "added": "0001-01-01T00:00:00Z",
    "ratings": {
      "votes": 0,
      "value": 0
    },
    "statistics": {
      "seasonCount": 5,
      "episodeFileCount": 0,
      "episodeCount": 0,
      "totalEpisodeCount": 62,
      "sizeOnDisk": 0,
      "percentOfEpisodes": 0
    }
  }
]
```

---

### Series Management

#### `GET /api/v3/series`

Get all series in the library.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tvdbId` | integer | No | Filter by TVDB ID |
| `includeSeasonImages` | boolean | No | Include season images (default: false) |

**Example Request:**

```bash
curl -X GET "https://sonarr.example.com/api/v3/series" \
  -H "X-Api-Key: your-api-key"
```

**Example Response:**

```json
[
  {
    "id": 1,
    "title": "Breaking Bad",
    "alternateTitles": [],
    "sortTitle": "breaking bad",
    "status": "ended",
    "ended": true,
    "overview": "A high school chemistry teacher...",
    "previousAiring": "2013-09-30T03:00:00Z",
    "network": "AMC",
    "airTime": "21:00",
    "images": [...],
    "seasons": [...],
    "year": 2008,
    "path": "/tv/Breaking Bad",
    "qualityProfileId": 1,
    "languageProfileId": 1,
    "seasonFolder": true,
    "monitored": true,
    "useSceneNumbering": false,
    "runtime": 60,
    "tvdbId": 81189,
    "tvRageId": 18164,
    "tvMazeId": 169,
    "firstAired": "2008-01-20T00:00:00Z",
    "seriesType": "standard",
    "cleanTitle": "breakingbad",
    "imdbId": "tt0903747",
    "titleSlug": "breaking-bad",
    "rootFolderPath": "/tv/",
    "certification": "TV-MA",
    "genres": ["Crime", "Drama"],
    "tags": [],
    "added": "2023-01-15T10:30:00Z",
    "ratings": {
      "votes": 1500,
      "value": 9.5
    },
    "statistics": {
      "seasonCount": 5,
      "episodeFileCount": 62,
      "episodeCount": 62,
      "totalEpisodeCount": 62,
      "sizeOnDisk": 125829120000,
      "percentOfEpisodes": 100
    }
  }
]
```

---

#### `GET /api/v3/series/{id}`

Get a specific series by ID.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Series ID |

**Example Request:**

```bash
curl -X GET "https://sonarr.example.com/api/v3/series/1" \
  -H "X-Api-Key: your-api-key"
```

---

#### `POST /api/v3/series`

Add a new series to the library.

**Request Body:**

```json
{
  "tvdbId": 81189,
  "title": "Breaking Bad",
  "qualityProfileId": 1,
  "languageProfileId": 1,
  "titleSlug": "breaking-bad",
  "images": [],
  "seasons": [
    { "seasonNumber": 1, "monitored": true },
    { "seasonNumber": 2, "monitored": true },
    { "seasonNumber": 3, "monitored": true },
    { "seasonNumber": 4, "monitored": true },
    { "seasonNumber": 5, "monitored": true }
  ],
  "rootFolderPath": "/tv/",
  "monitored": true,
  "seasonFolder": true,
  "seriesType": "standard",
  "addOptions": {
    "ignoreEpisodesWithFiles": true,
    "ignoreEpisodesWithoutFiles": false,
    "monitor": "all",
    "searchForMissingEpisodes": true,
    "searchForCutoffUnmetEpisodes": false
  }
}
```

**Add Options - Monitor Values:**

| Value | Description |
|-------|-------------|
| `all` | Monitor all episodes |
| `future` | Only monitor future episodes |
| `missing` | Monitor missing episodes |
| `existing` | Monitor existing episodes |
| `firstSeason` | Monitor first season only |
| `lastSeason` | Monitor last season only |
| `pilot` | Monitor pilot episode only |
| `none` | Don't monitor any episodes |

**Example Request:**

```bash
curl -X POST "https://sonarr.example.com/api/v3/series" \
  -H "X-Api-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "tvdbId": 81189,
    "title": "Breaking Bad",
    "qualityProfileId": 1,
    "languageProfileId": 1,
    "titleSlug": "breaking-bad",
    "rootFolderPath": "/tv/",
    "monitored": true,
    "seasonFolder": true,
    "addOptions": {
      "monitor": "all",
      "searchForMissingEpisodes": true
    }
  }'
```

---

#### `PUT /api/v3/series/{id}`

Update an existing series.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Series ID |

**Request Body:** Full series object with updated fields.

---

#### `DELETE /api/v3/series/{id}`

Remove a series from the library.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Series ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deleteFiles` | boolean | No | Delete series files (default: false) |
| `addImportListExclusion` | boolean | No | Add to import list exclusion (default: false) |

---

### Episode Management

#### `GET /api/v3/episode`

Get episodes, optionally filtered by series.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `seriesId` | integer | No | Filter by series ID |
| `seasonNumber` | integer | No | Filter by season number |
| `episodeIds` | array | No | Filter by episode IDs |
| `includeImages` | boolean | No | Include episode images |

**Example Request:**

```bash
curl -X GET "https://sonarr.example.com/api/v3/episode?seriesId=1&seasonNumber=1" \
  -H "X-Api-Key: your-api-key"
```

**Example Response:**

```json
[
  {
    "id": 1,
    "seriesId": 1,
    "tvdbId": 349232,
    "episodeFileId": 1,
    "seasonNumber": 1,
    "episodeNumber": 1,
    "title": "Pilot",
    "airDate": "2008-01-20",
    "airDateUtc": "2008-01-21T02:00:00Z",
    "overview": "Diagnosed with terminal lung cancer, chemistry teacher Walter White teams up with former student Jesse Pinkman...",
    "hasFile": true,
    "monitored": true,
    "absoluteEpisodeNumber": 1,
    "unverifiedSceneNumbering": false,
    "episodeFile": {
      "id": 1,
      "seriesId": 1,
      "seasonNumber": 1,
      "relativePath": "Season 1/Breaking Bad - S01E01 - Pilot.mkv",
      "path": "/tv/Breaking Bad/Season 1/Breaking Bad - S01E01 - Pilot.mkv",
      "size": 1500000000,
      "dateAdded": "2023-01-15T10:35:00Z",
      "quality": {
        "quality": {
          "id": 7,
          "name": "Bluray-1080p",
          "source": "bluray",
          "resolution": 1080
        },
        "revision": {
          "version": 1,
          "real": 0,
          "isRepack": false
        }
      },
      "mediaInfo": {
        "videoBitDepth": 8,
        "videoBitrate": 8000000,
        "videoCodec": "x264",
        "videoFps": 23.976,
        "resolution": "1920x1080",
        "runTime": "58:22",
        "scanType": "Progressive"
      }
    }
  }
]
```

---

#### `GET /api/v3/episode/{id}`

Get a specific episode by ID.

---

#### `PUT /api/v3/episode/{id}`

Update episode details (e.g., monitored status).

**Request Body:**

```json
{
  "id": 1,
  "monitored": true
}
```

---

#### `PUT /api/v3/episode/monitor`

Batch update monitored status for multiple episodes.

**Request Body:**

```json
{
  "episodeIds": [1, 2, 3, 4, 5],
  "monitored": true
}
```

---

### Queue

The queue shows currently downloading and pending items.

#### `GET /api/v3/queue`

Get the download queue with pagination.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | integer | No | Page number (default: 1) |
| `pageSize` | integer | No | Items per page (default: 10, max: 100) |
| `sortKey` | string | No | Sort field (e.g., "timeleft", "progress") |
| `sortDirection` | string | No | "ascending" or "descending" |
| `includeUnknownSeriesItems` | boolean | No | Include unknown series (default: false) |
| `includeSeries` | boolean | No | Include series info (default: false) |
| `includeEpisode` | boolean | No | Include episode info (default: false) |

**Example Request:**

```bash
curl -X GET "https://sonarr.example.com/api/v3/queue?page=1&pageSize=20&includeSeries=true&includeEpisode=true" \
  -H "X-Api-Key: your-api-key"
```

**Example Response:**

```json
{
  "page": 1,
  "pageSize": 20,
  "sortKey": "timeleft",
  "sortDirection": "ascending",
  "totalRecords": 2,
  "records": [
    {
      "id": 123,
      "seriesId": 1,
      "episodeId": 45,
      "seasonNumber": 3,
      "series": {
        "id": 1,
        "title": "Breaking Bad"
      },
      "episode": {
        "id": 45,
        "seasonNumber": 3,
        "episodeNumber": 1,
        "title": "No Mas"
      },
      "quality": {
        "quality": {
          "id": 7,
          "name": "Bluray-1080p"
        }
      },
      "size": 2500000000,
      "title": "Breaking.Bad.S03E01.1080p.BluRay.x264",
      "sizeleft": 1250000000,
      "timeleft": "00:15:30",
      "estimatedCompletionTime": "2024-01-15T12:30:00Z",
      "status": "downloading",
      "trackedDownloadStatus": "ok",
      "trackedDownloadState": "downloading",
      "statusMessages": [],
      "downloadId": "abc123def456",
      "protocol": "torrent",
      "downloadClient": "qBittorrent",
      "indexer": "Torznab",
      "outputPath": "/downloads/complete/Breaking.Bad.S03E01"
    }
  ]
}
```

**Queue Status Values:**

| Status | Description |
|--------|-------------|
| `downloading` | Currently downloading |
| `paused` | Download paused |
| `queued` | Queued for download |
| `completed` | Download completed |
| `delay` | Delayed for quality upgrade |
| `downloadClientUnavailable` | Download client offline |
| `warning` | Has warnings |
| `failed` | Download failed |

---

#### `GET /api/v3/queue/status`

Get a summary of queue status.

**Example Response:**

```json
{
  "totalCount": 5,
  "count": 2,
  "unknownCount": 0,
  "errors": false,
  "warnings": false,
  "unknownErrors": false,
  "unknownWarnings": false
}
```

---

#### `DELETE /api/v3/queue/{id}`

Remove an item from the queue.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `removeFromClient` | boolean | No | Remove from download client |
| `blocklist` | boolean | No | Add release to blocklist |

---

### Calendar

Get upcoming and recent episodes.

#### `GET /api/v3/calendar`

Get episodes airing within a date range.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start` | datetime | No | Start date (ISO 8601) |
| `end` | datetime | No | End date (ISO 8601) |
| `unmonitored` | boolean | No | Include unmonitored (default: false) |
| `includeSeries` | boolean | No | Include full series info |
| `includeEpisodeFile` | boolean | No | Include episode file info |
| `includeEpisodeImages` | boolean | No | Include episode images |

**Example Request:**

```bash
# Get episodes for the next 7 days
curl -X GET "https://sonarr.example.com/api/v3/calendar?start=2024-01-15&end=2024-01-22&includeSeries=true" \
  -H "X-Api-Key: your-api-key"
```

**Example Response:**

```json
[
  {
    "id": 123,
    "seriesId": 5,
    "tvdbId": 12345,
    "episodeFileId": 0,
    "seasonNumber": 2,
    "episodeNumber": 5,
    "title": "Episode Title",
    "airDate": "2024-01-17",
    "airDateUtc": "2024-01-18T01:00:00Z",
    "overview": "Episode description...",
    "hasFile": false,
    "monitored": true,
    "series": {
      "id": 5,
      "title": "Some TV Show",
      "status": "continuing",
      "network": "HBO",
      "images": [...]
    }
  }
]
```

---

### Quality Profiles

#### `GET /api/v3/qualityprofile`

Get all quality profiles.

**Example Response:**

```json
[
  {
    "id": 1,
    "name": "HD-1080p",
    "upgradeAllowed": true,
    "cutoff": 7,
    "items": [
      {
        "id": 1,
        "quality": {
          "id": 0,
          "name": "Unknown",
          "source": "unknown",
          "resolution": 0
        },
        "items": [],
        "allowed": false
      },
      {
        "id": 2,
        "quality": {
          "id": 7,
          "name": "Bluray-1080p",
          "source": "bluray",
          "resolution": 1080
        },
        "items": [],
        "allowed": true
      }
    ],
    "minFormatScore": 0,
    "cutoffFormatScore": 0,
    "formatItems": []
  }
]
```

---

### Root Folders

#### `GET /api/v3/rootfolder`

Get configured root folders for TV series storage.

**Example Response:**

```json
[
  {
    "id": 1,
    "path": "/tv/",
    "accessible": true,
    "freeSpace": 500000000000,
    "unmappedFolders": []
  }
]
```

---

### System

#### `GET /api/v3/system/status`

Get system status information.

**Example Response:**

```json
{
  "appName": "Sonarr",
  "instanceName": "Sonarr",
  "version": "4.0.0.700",
  "buildTime": "2024-01-01T00:00:00Z",
  "isDebug": false,
  "isProduction": true,
  "isAdmin": false,
  "isUserInteractive": false,
  "startupPath": "/app",
  "appData": "/config",
  "osName": "debian",
  "osVersion": "12",
  "isNetCore": true,
  "isLinux": true,
  "isOsx": false,
  "isWindows": false,
  "isDocker": true,
  "mode": "console",
  "branch": "main",
  "authentication": "forms",
  "sqliteVersion": "3.42.0",
  "migrationVersion": 200,
  "urlBase": "",
  "runtimeVersion": "8.0.0",
  "runtimeName": ".NET"
}
```

---

#### `GET /api/v3/health`

Get system health check results.

**Example Response:**

```json
[
  {
    "source": "IndexerStatusCheck",
    "type": "warning",
    "message": "Indexers unavailable due to failures: Example Indexer",
    "wikiUrl": "https://wiki.servarr.com/sonarr/system#indexers-are-unavailable-due-to-failures"
  }
]
```

---

#### `GET /api/v3/diskspace`

Get disk space information for all configured paths.

**Example Response:**

```json
[
  {
    "path": "/tv",
    "label": "TV",
    "freeSpace": 500000000000,
    "totalSpace": 2000000000000
  }
]
```

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created (for POST requests) |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing API key |
| 404 | Not Found - Resource doesn't exist |
| 405 | Method Not Allowed |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "message": "Series already exists",
  "description": "A series with the TVDB ID 81189 already exists in your library"
}
```

### Validation Errors

```json
[
  {
    "propertyName": "RootFolderPath",
    "errorMessage": "'Root Folder Path' must not be empty.",
    "attemptedValue": "",
    "severity": "error"
  }
]
```

---

## Webhook Support

Sonarr supports webhooks for real-time notifications.

### Configuring Webhooks

Navigate to **Settings > Connect > Add > Webhook**

### Supported Events

| Event | Description |
|-------|-------------|
| `onGrab` | Episode grabbed from indexer |
| `onDownload` | Episode downloaded |
| `onUpgrade` | Episode upgraded to better quality |
| `onRename` | Episode renamed |
| `onSeriesAdd` | New series added |
| `onSeriesDelete` | Series deleted |
| `onEpisodeFileDelete` | Episode file deleted |
| `onEpisodeFileDeleteForUpgrade` | Episode deleted for upgrade |
| `onHealthIssue` | Health check issue detected |
| `onHealthRestored` | Health check issue resolved |
| `onApplicationUpdate` | Sonarr updated |

### Webhook Payload Example (onDownload)

```json
{
  "eventType": "Download",
  "series": {
    "id": 1,
    "title": "Breaking Bad",
    "path": "/tv/Breaking Bad",
    "tvdbId": 81189
  },
  "episodes": [
    {
      "id": 45,
      "episodeNumber": 1,
      "seasonNumber": 3,
      "title": "No Mas",
      "airDate": "2010-03-21",
      "airDateUtc": "2010-03-22T01:00:00Z"
    }
  ],
  "episodeFile": {
    "id": 123,
    "relativePath": "Season 3/Breaking Bad - S03E01 - No Mas.mkv",
    "path": "/tv/Breaking Bad/Season 3/Breaking Bad - S03E01 - No Mas.mkv",
    "quality": "Bluray-1080p",
    "qualityVersion": 1,
    "size": 2500000000
  },
  "isUpgrade": false,
  "downloadClient": "qBittorrent",
  "downloadClientType": "qBittorrent",
  "downloadId": "ABC123"
}
```

---

## Common Use Cases for Chat Assistant

### 1. Search for a TV Series

```typescript
// Search for series by name
const searchSeries = async (term: string) => {
  const response = await fetch(
    `${baseUrl}/api/v3/series/lookup?term=${encodeURIComponent(term)}`,
    { headers: { 'X-Api-Key': apiKey } }
  );
  return response.json();
};
```

### 2. Add Series to Library

```typescript
// Add series with automatic search for missing episodes
const addSeries = async (series: any, qualityProfileId: number, rootFolderPath: string) => {
  const response = await fetch(`${baseUrl}/api/v3/series`, {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tvdbId: series.tvdbId,
      title: series.title,
      qualityProfileId,
      languageProfileId: 1, // Usually 1 for English
      titleSlug: series.titleSlug,
      images: series.images,
      seasons: series.seasons,
      rootFolderPath,
      monitored: true,
      seasonFolder: true,
      addOptions: {
        monitor: 'all',
        searchForMissingEpisodes: true
      }
    })
  });
  return response.json();
};
```

### 3. Check Download Queue

```typescript
// Get current download queue with series/episode info
const getQueue = async () => {
  const response = await fetch(
    `${baseUrl}/api/v3/queue?includeSeries=true&includeEpisode=true`,
    { headers: { 'X-Api-Key': apiKey } }
  );
  return response.json();
};
```

### 4. Get Upcoming Episodes

```typescript
// Get episodes airing in the next 7 days
const getUpcoming = async () => {
  const start = new Date().toISOString();
  const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch(
    `${baseUrl}/api/v3/calendar?start=${start}&end=${end}&includeSeries=true`,
    { headers: { 'X-Api-Key': apiKey } }
  );
  return response.json();
};
```

### 5. Get Library Overview

```typescript
// Get all series in library with statistics
const getLibrary = async () => {
  const response = await fetch(
    `${baseUrl}/api/v3/series`,
    { headers: { 'X-Api-Key': apiKey } }
  );
  return response.json();
};
```

---

## Additional Resources

- **Official Documentation**: https://wiki.servarr.com/sonarr
- **API Documentation**: https://wiki.servarr.com/sonarr/api
- **GitHub Repository**: https://github.com/Sonarr/Sonarr
- **Community Forums**: https://forums.sonarr.tv/

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-19 | Initial documentation for Assistarr project |
