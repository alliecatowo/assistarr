# Radarr API v3 Documentation

This document provides comprehensive API documentation for Radarr v3, focused on endpoints useful for the Assistarr chat assistant.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL Format](#base-url-format)
- [Rate Limiting](#rate-limiting)
- [Common Response Patterns](#common-response-patterns)
- [Key Endpoints](#key-endpoints)
  - [Movie Lookup/Search](#movie-lookupsearch)
  - [Movie Management](#movie-management)
  - [Queue](#queue)
  - [Calendar](#calendar)
  - [Quality Profiles](#quality-profiles)
  - [Root Folders](#root-folders)
  - [System](#system)
- [Error Handling](#error-handling)
- [Webhook Support](#webhook-support)

---

## Overview

Radarr is a movie collection manager for Usenet and BitTorrent users. It monitors multiple RSS feeds for new movies and will interface with clients and indexers to grab, sort, and rename them. It can also be configured to automatically upgrade the quality of existing files in the library when a better quality format becomes available.

The Radarr API v3 provides full programmatic access to all Radarr functionality. All endpoints return JSON and accept JSON for request bodies.

**API Version**: v3
**Base Path**: `/api/v3`
**Default Port**: 7878

---

## Authentication

Radarr uses API key authentication. The API key can be found in:

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
curl -X GET "https://radarr.example.com/api/v3/movie" \
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
https://radarr.allisons.dev/api/v3/movie
http://localhost:7878/api/v3/movie/lookup
```

### Common Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://radarr.allisons.dev/api/v3` |
| Local Default | `http://localhost:7878/api/v3` |
| Docker Default | `http://radarr:7878/api/v3` |

---

## Rate Limiting

Radarr does not implement explicit rate limiting at the API level. However:

- **Best Practice**: Limit requests to 1-2 per second for bulk operations
- **Batch Operations**: Use bulk endpoints where available
- **Polling**: For queue/calendar, poll no more than every 30-60 seconds
- **Search Operations**: Avoid rapid successive searches (TMDB has rate limits)

---

## Common Response Patterns

### Success Response

```json
{
  "id": 1,
  "title": "Movie Name",
  // ... additional fields
}
```

### Array Response

```json
[
  { "id": 1, "title": "Movie 1" },
  { "id": 2, "title": "Movie 2" }
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

### Movie Lookup/Search

Search for movies by name using TMDB (The Movie Database).

#### `GET /api/v3/movie/lookup`

Search for movies to add to your library.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `term` | string | Yes | Search query (movie name) |

**Example Request:**

```bash
curl -X GET "https://radarr.example.com/api/v3/movie/lookup?term=inception" \
  -H "X-Api-Key: your-api-key"
```

**Example Response:**

```json
[
  {
    "title": "Inception",
    "originalTitle": "Inception",
    "originalLanguage": {
      "id": 1,
      "name": "English"
    },
    "alternateTitles": [
      {
        "sourceType": "tmdb",
        "movieMetadataId": 0,
        "title": "Origin",
        "sourceId": 0,
        "votes": 0,
        "voteCount": 0,
        "language": {
          "id": 1,
          "name": "English"
        }
      }
    ],
    "sortTitle": "inception",
    "sizeOnDisk": 0,
    "status": "released",
    "overview": "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life...",
    "inCinemas": "2010-07-15T00:00:00Z",
    "physicalRelease": "2010-12-07T00:00:00Z",
    "digitalRelease": "2010-11-12T00:00:00Z",
    "images": [
      {
        "coverType": "poster",
        "url": "/MediaCover/Movies/inception/poster.jpg",
        "remoteUrl": "https://image.tmdb.org/t/p/original/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg"
      },
      {
        "coverType": "fanart",
        "url": "/MediaCover/Movies/inception/fanart.jpg",
        "remoteUrl": "https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg"
      }
    ],
    "remotePoster": "https://image.tmdb.org/t/p/original/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg",
    "year": 2010,
    "hasFile": false,
    "youTubeTrailerId": "YoHD9XEInc0",
    "studio": "Legendary Pictures",
    "qualityProfileId": 0,
    "monitored": false,
    "minimumAvailability": "announced",
    "isAvailable": true,
    "folderName": "",
    "runtime": 148,
    "cleanTitle": "inception",
    "imdbId": "tt1375666",
    "tmdbId": 27205,
    "titleSlug": "inception-27205",
    "certification": "PG-13",
    "genres": ["Action", "Science Fiction", "Adventure"],
    "tags": [],
    "added": "0001-01-01T00:00:00Z",
    "ratings": {
      "imdb": {
        "votes": 2500000,
        "value": 8.8,
        "type": "user"
      },
      "tmdb": {
        "votes": 35000,
        "value": 8.4,
        "type": "user"
      }
    },
    "popularity": 85.5
  }
]
```

---

#### `GET /api/v3/movie/lookup/tmdb`

Look up a specific movie by TMDB ID.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tmdbId` | integer | Yes | TMDB ID of the movie |

**Example Request:**

```bash
curl -X GET "https://radarr.example.com/api/v3/movie/lookup/tmdb?tmdbId=27205" \
  -H "X-Api-Key: your-api-key"
```

---

#### `GET /api/v3/movie/lookup/imdb`

Look up a specific movie by IMDB ID.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `imdbId` | string | Yes | IMDB ID of the movie (e.g., "tt1375666") |

**Example Request:**

```bash
curl -X GET "https://radarr.example.com/api/v3/movie/lookup/imdb?imdbId=tt1375666" \
  -H "X-Api-Key: your-api-key"
```

---

### Movie Management

#### `GET /api/v3/movie`

Get all movies in the library.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tmdbId` | integer | No | Filter by TMDB ID |
| `excludeLocalCovers` | boolean | No | Exclude local cover images (default: false) |

**Example Request:**

```bash
curl -X GET "https://radarr.example.com/api/v3/movie" \
  -H "X-Api-Key: your-api-key"
```

**Example Response:**

```json
[
  {
    "id": 1,
    "title": "Inception",
    "originalTitle": "Inception",
    "originalLanguage": {
      "id": 1,
      "name": "English"
    },
    "alternateTitles": [],
    "sortTitle": "inception",
    "sizeOnDisk": 15000000000,
    "status": "released",
    "overview": "Cobb, a skilled thief who commits corporate espionage...",
    "inCinemas": "2010-07-15T00:00:00Z",
    "physicalRelease": "2010-12-07T00:00:00Z",
    "digitalRelease": "2010-11-12T00:00:00Z",
    "images": [...],
    "year": 2010,
    "hasFile": true,
    "youTubeTrailerId": "YoHD9XEInc0",
    "studio": "Legendary Pictures",
    "path": "/movies/Inception (2010)",
    "qualityProfileId": 1,
    "monitored": true,
    "minimumAvailability": "released",
    "isAvailable": true,
    "folderName": "/movies/Inception (2010)",
    "runtime": 148,
    "cleanTitle": "inception",
    "imdbId": "tt1375666",
    "tmdbId": 27205,
    "titleSlug": "inception-27205",
    "rootFolderPath": "/movies/",
    "certification": "PG-13",
    "genres": ["Action", "Science Fiction", "Adventure"],
    "tags": [],
    "added": "2023-01-15T10:30:00Z",
    "ratings": {
      "imdb": {
        "votes": 2500000,
        "value": 8.8,
        "type": "user"
      },
      "tmdb": {
        "votes": 35000,
        "value": 8.4,
        "type": "user"
      }
    },
    "movieFile": {
      "id": 1,
      "movieId": 1,
      "relativePath": "Inception (2010) - Bluray-1080p.mkv",
      "path": "/movies/Inception (2010)/Inception (2010) - Bluray-1080p.mkv",
      "size": 15000000000,
      "dateAdded": "2023-01-15T10:35:00Z",
      "sceneName": "Inception.2010.1080p.BluRay.x264",
      "indexerFlags": 0,
      "quality": {
        "quality": {
          "id": 7,
          "name": "Bluray-1080p",
          "source": "bluray",
          "resolution": 1080,
          "modifier": "none"
        },
        "revision": {
          "version": 1,
          "real": 0,
          "isRepack": false
        }
      },
      "mediaInfo": {
        "audioBitrate": 1509000,
        "audioChannels": 5.1,
        "audioCodec": "DTS-HD MA",
        "audioLanguages": "English",
        "audioStreamCount": 1,
        "videoBitDepth": 8,
        "videoBitrate": 12000000,
        "videoCodec": "x264",
        "videoFps": 23.976,
        "videoDynamicRange": "",
        "videoDynamicRangeType": "",
        "resolution": "1920x1080",
        "runTime": "2:28:23",
        "scanType": "Progressive",
        "subtitles": "English"
      },
      "qualityCutoffNotMet": false,
      "languages": [
        {
          "id": 1,
          "name": "English"
        }
      ],
      "edition": "",
      "releaseGroup": "FGT"
    },
    "collection": {
      "title": null,
      "tmdbId": 0
    },
    "popularity": 85.5,
    "statistics": {
      "movieFileCount": 1,
      "sizeOnDisk": 15000000000,
      "releaseGroups": ["FGT"]
    }
  }
]
```

---

#### `GET /api/v3/movie/{id}`

Get a specific movie by ID.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Movie ID |

**Example Request:**

```bash
curl -X GET "https://radarr.example.com/api/v3/movie/1" \
  -H "X-Api-Key: your-api-key"
```

---

#### `POST /api/v3/movie`

Add a new movie to the library.

**Request Body:**

```json
{
  "tmdbId": 27205,
  "title": "Inception",
  "qualityProfileId": 1,
  "titleSlug": "inception-27205",
  "images": [],
  "rootFolderPath": "/movies/",
  "monitored": true,
  "minimumAvailability": "released",
  "addOptions": {
    "ignoreEpisodesWithFiles": false,
    "ignoreEpisodesWithoutFiles": false,
    "monitor": "movieOnly",
    "searchForMovie": true,
    "addMethod": "manual"
  }
}
```

**Minimum Availability Values:**

| Value | Description |
|-------|-------------|
| `announced` | Movie is announced |
| `inCinemas` | Movie is in cinemas |
| `released` | Movie has been released (physical/digital) |

**Add Options - Monitor Values:**

| Value | Description |
|-------|-------------|
| `movieOnly` | Monitor the movie only |
| `movieAndCollection` | Monitor movie and its collection |
| `none` | Don't monitor |

**Example Request:**

```bash
curl -X POST "https://radarr.example.com/api/v3/movie" \
  -H "X-Api-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "tmdbId": 27205,
    "title": "Inception",
    "qualityProfileId": 1,
    "titleSlug": "inception-27205",
    "rootFolderPath": "/movies/",
    "monitored": true,
    "minimumAvailability": "released",
    "addOptions": {
      "searchForMovie": true
    }
  }'
```

---

#### `PUT /api/v3/movie/{id}`

Update an existing movie.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Movie ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `moveFiles` | boolean | No | Move files if path changed (default: false) |

**Request Body:** Full movie object with updated fields.

---

#### `DELETE /api/v3/movie/{id}`

Remove a movie from the library.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Movie ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deleteFiles` | boolean | No | Delete movie files (default: false) |
| `addImportExclusion` | boolean | No | Add to import exclusion list (default: false) |

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
| `sortKey` | string | No | Sort field (e.g., "timeleft", "progress", "movie.sortTitle") |
| `sortDirection` | string | No | "ascending" or "descending" |
| `includeUnknownMovieItems` | boolean | No | Include unknown movies (default: false) |
| `includeMovie` | boolean | No | Include movie info (default: false) |
| `movieIds` | array | No | Filter by movie IDs |
| `protocol` | string | No | Filter by protocol ("usenet" or "torrent") |

**Example Request:**

```bash
curl -X GET "https://radarr.example.com/api/v3/queue?page=1&pageSize=20&includeMovie=true" \
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
      "movieId": 1,
      "movie": {
        "id": 1,
        "title": "Inception",
        "year": 2010,
        "tmdbId": 27205,
        "imdbId": "tt1375666"
      },
      "languages": [
        {
          "id": 1,
          "name": "English"
        }
      ],
      "quality": {
        "quality": {
          "id": 7,
          "name": "Bluray-1080p",
          "source": "bluray",
          "resolution": 1080,
          "modifier": "none"
        },
        "revision": {
          "version": 1,
          "real": 0,
          "isRepack": false
        }
      },
      "customFormats": [],
      "customFormatScore": 0,
      "size": 15000000000,
      "title": "Inception.2010.1080p.BluRay.x264-FGT",
      "sizeleft": 7500000000,
      "timeleft": "00:30:00",
      "estimatedCompletionTime": "2024-01-15T12:30:00Z",
      "status": "downloading",
      "trackedDownloadStatus": "ok",
      "trackedDownloadState": "downloading",
      "statusMessages": [],
      "errorMessage": "",
      "downloadId": "abc123def456",
      "protocol": "torrent",
      "downloadClient": "qBittorrent",
      "indexer": "Torznab",
      "outputPath": "/downloads/complete/Inception.2010.1080p.BluRay.x264-FGT"
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
| `removeFromClient` | boolean | No | Remove from download client (default: true) |
| `blocklist` | boolean | No | Add release to blocklist (default: false) |
| `skipRedownload` | boolean | No | Skip automatic redownload (default: false) |
| `changeCategory` | boolean | No | Change category in download client (default: false) |

---

#### `DELETE /api/v3/queue/bulk`

Remove multiple items from the queue.

**Request Body:**

```json
{
  "ids": [1, 2, 3],
  "removeFromClient": true,
  "blocklist": false,
  "skipRedownload": false
}
```

---

### Calendar

Get upcoming and recent movie releases.

#### `GET /api/v3/calendar`

Get movies releasing within a date range.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start` | datetime | No | Start date (ISO 8601) |
| `end` | datetime | No | End date (ISO 8601) |
| `unmonitored` | boolean | No | Include unmonitored movies (default: false) |
| `includeArtist` | boolean | No | Include artist info (deprecated, use includeMovie) |

**Example Request:**

```bash
# Get movies releasing in the next 30 days
curl -X GET "https://radarr.example.com/api/v3/calendar?start=2024-01-15&end=2024-02-15" \
  -H "X-Api-Key: your-api-key"
```

**Example Response:**

```json
[
  {
    "id": 45,
    "title": "Upcoming Movie",
    "originalTitle": "Upcoming Movie",
    "originalLanguage": {
      "id": 1,
      "name": "English"
    },
    "sortTitle": "upcoming movie",
    "sizeOnDisk": 0,
    "status": "announced",
    "overview": "An upcoming movie description...",
    "inCinemas": "2024-02-01T00:00:00Z",
    "physicalRelease": "2024-05-01T00:00:00Z",
    "digitalRelease": "2024-04-15T00:00:00Z",
    "images": [...],
    "year": 2024,
    "hasFile": false,
    "studio": "Warner Bros",
    "path": "/movies/Upcoming Movie (2024)",
    "qualityProfileId": 1,
    "monitored": true,
    "minimumAvailability": "released",
    "isAvailable": false,
    "runtime": 120,
    "tmdbId": 12345,
    "imdbId": "tt1234567",
    "titleSlug": "upcoming-movie-12345",
    "certification": "PG-13",
    "genres": ["Action", "Adventure"],
    "tags": [],
    "added": "2024-01-10T15:00:00Z",
    "ratings": {
      "tmdb": {
        "votes": 0,
        "value": 0,
        "type": "user"
      }
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
        "id": 1000,
        "name": "WEB 1080p",
        "items": [
          {
            "quality": {
              "id": 3,
              "name": "WEBDL-1080p",
              "source": "webdl",
              "resolution": 1080,
              "modifier": "none"
            },
            "items": [],
            "allowed": true
          },
          {
            "quality": {
              "id": 15,
              "name": "WEBRip-1080p",
              "source": "webrip",
              "resolution": 1080,
              "modifier": "none"
            },
            "items": [],
            "allowed": true
          }
        ],
        "allowed": true
      },
      {
        "quality": {
          "id": 7,
          "name": "Bluray-1080p",
          "source": "bluray",
          "resolution": 1080,
          "modifier": "none"
        },
        "items": [],
        "allowed": true
      }
    ],
    "minFormatScore": 0,
    "cutoffFormatScore": 0,
    "formatItems": [],
    "language": {
      "id": 1,
      "name": "English"
    }
  },
  {
    "id": 2,
    "name": "Ultra-HD",
    "upgradeAllowed": true,
    "cutoff": 19,
    "items": [
      {
        "quality": {
          "id": 18,
          "name": "WEBDL-2160p",
          "source": "webdl",
          "resolution": 2160,
          "modifier": "none"
        },
        "items": [],
        "allowed": true
      },
      {
        "quality": {
          "id": 19,
          "name": "Bluray-2160p",
          "source": "bluray",
          "resolution": 2160,
          "modifier": "none"
        },
        "items": [],
        "allowed": true
      }
    ],
    "language": {
      "id": 1,
      "name": "English"
    }
  }
]
```

---

### Root Folders

#### `GET /api/v3/rootfolder`

Get configured root folders for movie storage.

**Example Response:**

```json
[
  {
    "id": 1,
    "path": "/movies/",
    "accessible": true,
    "freeSpace": 500000000000,
    "unmappedFolders": []
  },
  {
    "id": 2,
    "path": "/movies-4k/",
    "accessible": true,
    "freeSpace": 200000000000,
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
  "appName": "Radarr",
  "instanceName": "Radarr",
  "version": "5.2.0.8171",
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
  "branch": "master",
  "databaseType": "sqLite",
  "databaseVersion": "3.42.0",
  "authentication": "forms",
  "migrationVersion": 240,
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
    "wikiUrl": "https://wiki.servarr.com/radarr/system#indexers-are-unavailable-due-to-failures"
  },
  {
    "source": "DownloadClientCheck",
    "type": "error",
    "message": "Unable to connect to qBittorrent",
    "wikiUrl": "https://wiki.servarr.com/radarr/system#unable-to-communicate-with-download-client"
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
    "path": "/movies",
    "label": "Movies",
    "freeSpace": 500000000000,
    "totalSpace": 2000000000000
  },
  {
    "path": "/movies-4k",
    "label": "4K Movies",
    "freeSpace": 200000000000,
    "totalSpace": 1000000000000
  }
]
```

---

### Command

Execute commands for searching, refreshing, etc.

#### `POST /api/v3/command`

Trigger a command.

**Common Commands:**

| Command Name | Description | Body Parameters |
|--------------|-------------|-----------------|
| `MoviesSearch` | Search for a movie | `movieIds: [1, 2, 3]` |
| `RefreshMovie` | Refresh movie info | `movieIds: [1, 2, 3]` (optional, all if empty) |
| `RenameMovie` | Rename movie files | `movieIds: [1, 2, 3]` |
| `RescanMovie` | Rescan movie files | `movieId: 1` |
| `MissingMoviesSearch` | Search for all missing | none |
| `CutoffUnmetMoviesSearch` | Search for cutoff unmet | none |
| `DownloadedMoviesScan` | Scan downloads folder | `path: "/downloads"` (optional) |

**Example Request (Search for Movie):**

```bash
curl -X POST "https://radarr.example.com/api/v3/command" \
  -H "X-Api-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MoviesSearch",
    "movieIds": [1, 2, 3]
  }'
```

**Example Response:**

```json
{
  "id": 1,
  "name": "MoviesSearch",
  "commandName": "Movies Search",
  "message": "Searching for 3 movies",
  "body": {
    "movieIds": [1, 2, 3],
    "sendUpdatesToClient": true
  },
  "priority": "normal",
  "status": "queued",
  "queued": "2024-01-15T12:00:00Z",
  "trigger": "manual"
}
```

---

### Tags

#### `GET /api/v3/tag`

Get all tags.

**Example Response:**

```json
[
  {
    "id": 1,
    "label": "4k"
  },
  {
    "id": 2,
    "label": "anime"
  }
]
```

---

### Import Lists

#### `GET /api/v3/importlist`

Get all configured import lists.

---

### Exclusions

#### `GET /api/v3/exclusions`

Get all excluded movies (won't be auto-imported).

**Example Response:**

```json
[
  {
    "id": 1,
    "tmdbId": 12345,
    "movieTitle": "Excluded Movie",
    "movieYear": 2023
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
| 202 | Accepted (for commands) |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing API key |
| 404 | Not Found - Resource doesn't exist |
| 405 | Method Not Allowed |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "message": "Movie already exists",
  "description": "A movie with the TMDB ID 27205 already exists in your library"
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
  },
  {
    "propertyName": "QualityProfileId",
    "errorMessage": "'Quality Profile Id' must be greater than 0.",
    "attemptedValue": 0,
    "severity": "error"
  }
]
```

---

## Webhook Support

Radarr supports webhooks for real-time notifications.

### Configuring Webhooks

Navigate to **Settings > Connect > Add > Webhook**

### Supported Events

| Event | Description |
|-------|-------------|
| `onGrab` | Movie grabbed from indexer |
| `onDownload` | Movie downloaded |
| `onUpgrade` | Movie upgraded to better quality |
| `onRename` | Movie file renamed |
| `onMovieAdded` | New movie added |
| `onMovieDelete` | Movie deleted |
| `onMovieFileDelete` | Movie file deleted |
| `onMovieFileDeleteForUpgrade` | File deleted for upgrade |
| `onHealthIssue` | Health check issue detected |
| `onHealthRestored` | Health check issue resolved |
| `onApplicationUpdate` | Radarr updated |
| `onManualInteractionRequired` | Manual import required |

### Webhook Payload Example (onDownload)

```json
{
  "eventType": "Download",
  "instanceName": "Radarr",
  "applicationUrl": "https://radarr.example.com",
  "movie": {
    "id": 1,
    "title": "Inception",
    "year": 2010,
    "filePath": "/movies/Inception (2010)/Inception (2010) - Bluray-1080p.mkv",
    "releaseDate": "2010-07-16",
    "folderPath": "/movies/Inception (2010)",
    "tmdbId": 27205,
    "imdbId": "tt1375666",
    "overview": "Cobb, a skilled thief..."
  },
  "remoteMovie": {
    "tmdbId": 27205,
    "imdbId": "tt1375666",
    "title": "Inception",
    "year": 2010
  },
  "movieFile": {
    "id": 1,
    "relativePath": "Inception (2010) - Bluray-1080p.mkv",
    "path": "/movies/Inception (2010)/Inception (2010) - Bluray-1080p.mkv",
    "quality": "Bluray-1080p",
    "qualityVersion": 1,
    "releaseGroup": "FGT",
    "sceneName": "Inception.2010.1080p.BluRay.x264-FGT",
    "indexerFlags": "",
    "size": 15000000000,
    "dateAdded": "2024-01-15T12:00:00Z",
    "mediaInfo": {
      "audioChannels": 5.1,
      "audioCodec": "DTS-HD MA",
      "audioLanguages": "English",
      "height": 1080,
      "width": 1920,
      "subtitles": "English",
      "videoCodec": "x264",
      "videoDynamicRange": "",
      "videoDynamicRangeType": ""
    }
  },
  "release": {
    "quality": "Bluray-1080p",
    "qualityVersion": 1,
    "releaseGroup": "FGT",
    "releaseTitle": "Inception.2010.1080p.BluRay.x264-FGT",
    "indexer": "Torznab",
    "size": 15000000000
  },
  "downloadClient": "qBittorrent",
  "downloadClientType": "qBittorrent",
  "downloadId": "ABC123",
  "isUpgrade": false
}
```

---

## Common Use Cases for Chat Assistant

### 1. Search for a Movie

```typescript
// Search for movies by name
const searchMovies = async (term: string) => {
  const response = await fetch(
    `${baseUrl}/api/v3/movie/lookup?term=${encodeURIComponent(term)}`,
    { headers: { 'X-Api-Key': apiKey } }
  );
  return response.json();
};
```

### 2. Add Movie to Library

```typescript
// Add movie with automatic search
const addMovie = async (movie: any, qualityProfileId: number, rootFolderPath: string) => {
  const response = await fetch(`${baseUrl}/api/v3/movie`, {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tmdbId: movie.tmdbId,
      title: movie.title,
      qualityProfileId,
      titleSlug: movie.titleSlug,
      images: movie.images,
      rootFolderPath,
      monitored: true,
      minimumAvailability: 'released',
      addOptions: {
        searchForMovie: true
      }
    })
  });
  return response.json();
};
```

### 3. Check Download Queue

```typescript
// Get current download queue with movie info
const getQueue = async () => {
  const response = await fetch(
    `${baseUrl}/api/v3/queue?includeMovie=true`,
    { headers: { 'X-Api-Key': apiKey } }
  );
  return response.json();
};
```

### 4. Get Upcoming Releases

```typescript
// Get movies releasing in the next 30 days
const getUpcoming = async () => {
  const start = new Date().toISOString();
  const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch(
    `${baseUrl}/api/v3/calendar?start=${start}&end=${end}`,
    { headers: { 'X-Api-Key': apiKey } }
  );
  return response.json();
};
```

### 5. Get Library Overview

```typescript
// Get all movies in library with statistics
const getLibrary = async () => {
  const response = await fetch(
    `${baseUrl}/api/v3/movie`,
    { headers: { 'X-Api-Key': apiKey } }
  );
  return response.json();
};
```

### 6. Search for Missing Movie

```typescript
// Trigger a search for a specific movie
const searchForMovie = async (movieId: number) => {
  const response = await fetch(`${baseUrl}/api/v3/command`, {
    method: 'POST',
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'MoviesSearch',
      movieIds: [movieId]
    })
  });
  return response.json();
};
```

---

## Differences from Sonarr API

| Feature | Radarr | Sonarr |
|---------|--------|--------|
| Media Type | Movies | TV Series |
| ID Source | TMDB ID | TVDB ID |
| Endpoint Prefix | `/api/v3/movie` | `/api/v3/series` |
| Default Port | 7878 | 8989 |
| Season Handling | N/A | Season/Episode structure |
| Minimum Availability | `announced`, `inCinemas`, `released` | N/A |
| Add Options | `searchForMovie` | `searchForMissingEpisodes` |

---

## Additional Resources

- **Official Documentation**: https://wiki.servarr.com/radarr
- **GitHub Repository**: https://github.com/Radarr/Radarr
- **Community Forums**: https://forums.radarr.video/
- **Discord**: https://discord.gg/radarr

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-19 | Initial documentation for Assistarr project |
