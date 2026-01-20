# Jellyseerr API Documentation

Jellyseerr is a fork of Overseerr that adds Jellyfin support. It serves as a media request management system that integrates with Radarr (movies) and Sonarr (TV shows).

## Base URL Format

```
https://{jellyseerr-host}/api/v1
```

For the Assistarr project:
```
https://request.allisons.dev/api/v1
```

## Authentication

Jellyseerr supports multiple authentication methods:

### 1. API Key Authentication (Recommended for Bots/Integrations)

Include the API key in the request header:

```http
X-Api-Key: your-api-key-here
```

The API key can be found in:
- **Settings > General > API Key** in the Jellyseerr web interface

### 2. Cookie-Based Authentication (Session)

For user-authenticated requests, Jellyseerr uses session cookies after login:

```http
Cookie: connect.sid=session-token-here
```

### 3. Local User Authentication

```http
POST /api/v1/auth/local
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "plexToken": null,
  "jellyfinAuthToken": "token",
  "permissions": 2,
  "avatar": "...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Key Endpoints for Chat Assistant

### Search Endpoints

#### Search for Movies/TV Shows (Combined)

```http
GET /api/v1/search?query={query}&page={page}&language={language}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |
| page | integer | No | Page number (default: 1) |
| language | string | No | ISO 639-1 language code (default: en) |

**Response:**
```json
{
  "page": 1,
  "totalPages": 10,
  "totalResults": 195,
  "results": [
    {
      "id": 550,
      "mediaType": "movie",
      "popularity": 35.883,
      "posterPath": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      "backdropPath": "/rr7E0NoGKxvbkb89eR1GwfoYjpA.jpg",
      "voteCount": 26280,
      "voteAverage": 8.438,
      "genreIds": [18],
      "overview": "A ticking-Loss taco...",
      "originalLanguage": "en",
      "title": "Fight Club",
      "originalTitle": "Fight Club",
      "releaseDate": "1999-10-15",
      "adult": false,
      "video": false,
      "mediaInfo": {
        "id": 1,
        "tmdbId": 550,
        "tvdbId": null,
        "status": 5,
        "requests": [],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    },
    {
      "id": 1396,
      "mediaType": "tv",
      "name": "Breaking Bad",
      "originalName": "Breaking Bad",
      "firstAirDate": "2008-01-20",
      ...
    }
  ]
}
```

#### Search Movies Only

```http
GET /api/v1/search/movie?query={query}&page={page}&language={language}
```

#### Search TV Shows Only

```http
GET /api/v1/search/tv?query={query}&page={page}&language={language}
```

#### Get Movie Details

```http
GET /api/v1/movie/{tmdbId}
```

**Response:**
```json
{
  "id": 550,
  "imdbId": "tt0137523",
  "adult": false,
  "backdropPath": "/rr7E0NoGKxvbkb89eR1GwfoYjpA.jpg",
  "posterPath": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  "budget": 63000000,
  "genres": [
    { "id": 18, "name": "Drama" }
  ],
  "homepage": "http://www.foxmovies.com/movies/fight-club",
  "originalLanguage": "en",
  "originalTitle": "Fight Club",
  "overview": "A ticking-time-bomb insomniac...",
  "popularity": 35.883,
  "releaseDate": "1999-10-15",
  "revenue": 100853753,
  "runtime": 139,
  "status": "Released",
  "tagline": "Mischief. Mayhem. Soap.",
  "title": "Fight Club",
  "video": false,
  "voteAverage": 8.438,
  "voteCount": 26280,
  "credits": { ... },
  "externalIds": {
    "imdbId": "tt0137523",
    "facebookId": null,
    "instagramId": null,
    "twitterId": null
  },
  "mediaInfo": {
    "id": 1,
    "tmdbId": 550,
    "status": 5,
    "requests": [ ... ]
  },
  "watchProviders": [ ... ]
}
```

#### Get TV Show Details

```http
GET /api/v1/tv/{tmdbId}
```

**Response:**
```json
{
  "id": 1396,
  "backdropPath": "/eSzpy96DwBujGFj0xMbXBcGcfxX.jpg",
  "posterPath": "/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg",
  "contentRatings": { ... },
  "createdBy": [
    { "id": 66633, "name": "Vince Gilligan" }
  ],
  "episodeRunTime": [45, 47],
  "firstAirDate": "2008-01-20",
  "genres": [
    { "id": 18, "name": "Drama" }
  ],
  "homepage": "http://www.amc.com/shows/breaking-bad",
  "inProduction": false,
  "languages": ["en"],
  "lastAirDate": "2013-09-29",
  "name": "Breaking Bad",
  "numberOfEpisodes": 62,
  "numberOfSeasons": 5,
  "originCountry": ["US"],
  "originalLanguage": "en",
  "originalName": "Breaking Bad",
  "overview": "When Walter White...",
  "popularity": 308.739,
  "status": "Ended",
  "tagline": "All Hail the King",
  "type": "Scripted",
  "voteAverage": 8.9,
  "voteCount": 12023,
  "seasons": [
    {
      "id": 3577,
      "airDate": "2008-01-20",
      "episodeCount": 7,
      "name": "Season 1",
      "overview": "...",
      "posterPath": "/...",
      "seasonNumber": 1
    }
  ],
  "mediaInfo": { ... }
}
```

---

### Request Management Endpoints

#### Create a Movie Request

```http
POST /api/v1/request
Content-Type: application/json
```

**Request Body:**
```json
{
  "mediaType": "movie",
  "mediaId": 550,
  "is4k": false,
  "serverId": 0,
  "profileId": 0,
  "rootFolder": "/movies",
  "languageProfileId": 1,
  "tags": []
}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| mediaType | string | Yes | "movie" or "tv" |
| mediaId | integer | Yes | TMDb ID of the media |
| is4k | boolean | No | Request 4K version (default: false) |
| serverId | integer | No | Radarr/Sonarr server ID |
| profileId | integer | No | Quality profile ID |
| rootFolder | string | No | Root folder path |
| languageProfileId | integer | No | Language profile ID |
| tags | array | No | Tag IDs to apply |
| seasons | array | No | Season numbers for TV requests |

**Response:**
```json
{
  "id": 123,
  "status": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "type": "movie",
  "is4k": false,
  "serverId": 0,
  "profileId": 4,
  "rootFolder": "/movies",
  "languageProfileId": 1,
  "tags": [],
  "media": {
    "id": 1,
    "tmdbId": 550,
    "status": 2
  },
  "requestedBy": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

#### Create a TV Show Request

```http
POST /api/v1/request
Content-Type: application/json

{
  "mediaType": "tv",
  "mediaId": 1396,
  "is4k": false,
  "seasons": [1, 2, 3, 4, 5]
}
```

For requesting all seasons, you can use `"seasons": "all"`.

#### Get All Requests

```http
GET /api/v1/request?take={take}&skip={skip}&filter={filter}&sort={sort}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| take | integer | No | Number of results (default: 10, max: 100) |
| skip | integer | No | Number of results to skip |
| filter | string | No | Filter: all, approved, available, pending, processing, unavailable |
| sort | string | No | Sort: added, modified |
| requestedBy | integer | No | Filter by user ID |

**Response:**
```json
{
  "pageInfo": {
    "pages": 5,
    "pageSize": 10,
    "results": 50,
    "page": 1
  },
  "results": [
    {
      "id": 123,
      "status": 2,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "type": "movie",
      "is4k": false,
      "media": {
        "id": 1,
        "tmdbId": 550,
        "status": 5,
        "externalServiceId": 123,
        "externalServiceSlug": "fight-club-550"
      },
      "requestedBy": {
        "id": 1,
        "displayName": "Admin"
      },
      "modifiedBy": null
    }
  ]
}
```

#### Get Single Request

```http
GET /api/v1/request/{requestId}
```

#### Update Request Status (Admin)

```http
PUT /api/v1/request/{requestId}
Content-Type: application/json

{
  "mediaType": "movie",
  "serverId": 0,
  "profileId": 4,
  "rootFolder": "/movies"
}
```

#### Approve Request

```http
POST /api/v1/request/{requestId}/approve
```

#### Decline Request

```http
POST /api/v1/request/{requestId}/decline
```

#### Delete Request

```http
DELETE /api/v1/request/{requestId}
```

#### Retry Request

```http
POST /api/v1/request/{requestId}/retry
```

---

### Status Check Endpoints

#### Get Media Status by TMDb ID

```http
GET /api/v1/media?tmdbId={tmdbId}
```

**Response:**
```json
{
  "id": 1,
  "tmdbId": 550,
  "tvdbId": null,
  "mediaType": "movie",
  "status": 5,
  "requests": [
    {
      "id": 123,
      "status": 2
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "externalServiceId": 456,
  "externalServiceSlug": "fight-club-550",
  "externalServiceId4k": null,
  "externalServiceSlug4k": null,
  "ratingKey": "12345",
  "ratingKey4k": null
}
```

**Media Status Values:**
| Status | Value | Description |
|--------|-------|-------------|
| UNKNOWN | 1 | Unknown status |
| PENDING | 2 | Request pending approval |
| PROCESSING | 3 | Being processed by Radarr/Sonarr |
| PARTIALLY_AVAILABLE | 4 | Some content available (TV shows) |
| AVAILABLE | 5 | Fully available in library |

**Request Status Values:**
| Status | Value | Description |
|--------|-------|-------------|
| PENDING | 1 | Awaiting approval |
| APPROVED | 2 | Approved, sent to Radarr/Sonarr |
| DECLINED | 3 | Declined by admin |

#### Check if Media Exists

```http
GET /api/v1/movie/{tmdbId}
```

The `mediaInfo` field in the response indicates if the movie exists:
- `mediaInfo: null` - Not in system
- `mediaInfo.status: 2` - Requested/Pending
- `mediaInfo.status: 5` - Available

---

### User Endpoints

#### Get Current User

```http
GET /api/v1/auth/me
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "plexUsername": null,
  "jellyfinUsername": "admin",
  "username": null,
  "recoveryLinkExpirationDate": null,
  "userType": 2,
  "permissions": 2,
  "avatar": "https://...",
  "movieQuotaLimit": null,
  "movieQuotaDays": null,
  "tvQuotaLimit": null,
  "tvQuotaDays": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "requestCount": 5,
  "settings": { ... }
}
```

#### Get User Requests

```http
GET /api/v1/user/{userId}/requests
```

#### Get User Watchlist

```http
GET /api/v1/user/{userId}/watchlist
```

---

### Discovery Endpoints

#### Get Trending Movies

```http
GET /api/v1/discover/movies?page={page}
```

#### Get Trending TV Shows

```http
GET /api/v1/discover/tv?page={page}
```

#### Get Upcoming Movies

```http
GET /api/v1/discover/movies/upcoming?page={page}
```

#### Get Recently Added

```http
GET /api/v1/media?filter=available&take=20
```

---

## Integration with Radarr/Sonarr

Jellyseerr acts as a frontend that communicates with Radarr and Sonarr to fulfill media requests.

### How It Works

1. **User searches** for content via Jellyseerr (uses TMDb API)
2. **User creates request** through Jellyseerr
3. **Admin approves** (or auto-approval if configured)
4. **Jellyseerr sends** the request to Radarr (movies) or Sonarr (TV)
5. **Radarr/Sonarr downloads** the content
6. **Jellyseerr monitors** status and updates availability

### Service Configuration Endpoints

#### Get Radarr Servers

```http
GET /api/v1/settings/radarr
```

**Response:**
```json
[
  {
    "id": 0,
    "name": "Radarr",
    "hostname": "radarr.allisons.dev",
    "port": 443,
    "apiKey": "***",
    "useSsl": true,
    "baseUrl": "",
    "activeProfileId": 4,
    "activeProfileName": "HD-1080p",
    "activeDirectory": "/movies",
    "is4k": false,
    "minimumAvailability": "released",
    "tags": [],
    "isDefault": true,
    "externalUrl": "https://radarr.allisons.dev"
  }
]
```

#### Get Sonarr Servers

```http
GET /api/v1/settings/sonarr
```

**Response:**
```json
[
  {
    "id": 0,
    "name": "Sonarr",
    "hostname": "sonarr.allisons.dev",
    "port": 443,
    "apiKey": "***",
    "useSsl": true,
    "baseUrl": "",
    "activeProfileId": 4,
    "activeProfileName": "HD-1080p",
    "activeDirectory": "/tv",
    "activeAnimeProfileId": null,
    "activeAnimeDirectory": null,
    "activeLanguageProfileId": 1,
    "activeAnimeLanguageProfileId": null,
    "tags": [],
    "animeTags": [],
    "is4k": false,
    "isDefault": true,
    "enableSeasonFolders": true,
    "externalUrl": "https://sonarr.allisons.dev"
  }
]
```

#### Get Quality Profiles from Radarr

```http
GET /api/v1/settings/radarr/{serverId}/profiles
```

#### Get Quality Profiles from Sonarr

```http
GET /api/v1/settings/sonarr/{serverId}/profiles
```

---

## Example Request/Response Flows

### Flow 1: Search and Request a Movie

```bash
# 1. Search for the movie
GET /api/v1/search?query=inception
X-Api-Key: your-api-key

# Response includes TMDb ID: 27205

# 2. Get movie details and check if available
GET /api/v1/movie/27205
X-Api-Key: your-api-key

# If mediaInfo.status != 5, create request:

# 3. Create request
POST /api/v1/request
X-Api-Key: your-api-key
Content-Type: application/json

{
  "mediaType": "movie",
  "mediaId": 27205
}
```

### Flow 2: Check Request Status

```bash
# Get all pending requests
GET /api/v1/request?filter=pending
X-Api-Key: your-api-key

# Or check specific media by TMDb ID
GET /api/v1/movie/27205
X-Api-Key: your-api-key

# Check mediaInfo.status field
```

### Flow 3: Request TV Show (Specific Seasons)

```bash
# 1. Search and get TMDb ID
GET /api/v1/search?query=breaking%20bad
X-Api-Key: your-api-key

# 2. Get TV details to see available seasons
GET /api/v1/tv/1396
X-Api-Key: your-api-key

# 3. Request specific seasons
POST /api/v1/request
X-Api-Key: your-api-key
Content-Type: application/json

{
  "mediaType": "tv",
  "mediaId": 1396,
  "seasons": [1, 2]
}
```

---

## Error Handling

### Common Error Responses

```json
{
  "message": "You do not have permission to access this resource.",
  "statusCode": 403
}
```

```json
{
  "message": "Media not found",
  "statusCode": 404
}
```

```json
{
  "message": "Request already exists for this media",
  "statusCode": 409
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 429 | Rate Limited |
| 500 | Server Error |

---

## Rate Limiting

Jellyseerr implements rate limiting on API endpoints. When rate limited, you'll receive a 429 response with a `Retry-After` header.

**Best Practices:**
- Cache search results when possible
- Implement exponential backoff for retries
- Batch requests where the API supports it

---

## Permissions

Jellyseerr uses a bitmask permission system:

| Permission | Value | Description |
|------------|-------|-------------|
| ADMIN | 2 | Full administrator access |
| REQUEST | 8 | Can create requests |
| REQUEST_4K | 16 | Can request 4K content |
| REQUEST_4K_MOVIE | 32 | Can request 4K movies |
| REQUEST_4K_TV | 64 | Can request 4K TV |
| AUTO_APPROVE | 128 | Requests auto-approved |
| AUTO_APPROVE_4K | 256 | 4K requests auto-approved |
| REQUEST_ADVANCED | 512 | Can set quality profile, etc. |
| MANAGE_REQUESTS | 1024 | Can manage others' requests |

---

## Webhook Integration

Jellyseerr can send webhooks on various events:

**Events:**
- `MEDIA_PENDING` - New request created
- `MEDIA_APPROVED` - Request approved
- `MEDIA_AVAILABLE` - Media now available
- `MEDIA_DECLINED` - Request declined
- `MEDIA_FAILED` - Request failed
- `MEDIA_AUTO_APPROVED` - Request auto-approved

**Webhook Payload:**
```json
{
  "notification_type": "MEDIA_AVAILABLE",
  "subject": "Fight Club",
  "message": "Fight Club is now available!",
  "image": "https://image.tmdb.org/...",
  "media": {
    "media_type": "movie",
    "tmdbId": 550,
    "imdbId": "tt0137523",
    "status": "AVAILABLE",
    "status4k": "UNKNOWN"
  },
  "request": {
    "request_id": 123,
    "requestedBy_email": "user@example.com",
    "requestedBy_username": "admin"
  }
}
```

---

## Notes for Chat Assistant Implementation

1. **Always check `mediaInfo.status`** before creating a request to avoid duplicates
2. **Use TMDb IDs** as the primary identifier for all media
3. **Cache quality profiles** - they don't change often
4. **Handle partial availability** for TV shows (some seasons available)
5. **Show meaningful status messages** based on request/media status codes
6. **Respect user permissions** - check before offering 4K options

### Recommended Tool Implementations

```typescript
// Example tool definitions for AI SDK
const tools = {
  search_media: {
    description: "Search for movies or TV shows",
    parameters: {
      query: { type: "string", description: "Search query" },
      type: { type: "string", enum: ["movie", "tv", "all"], default: "all" }
    }
  },

  request_media: {
    description: "Request a movie or TV show to be added to the library",
    parameters: {
      tmdbId: { type: "number", description: "TMDb ID of the media" },
      mediaType: { type: "string", enum: ["movie", "tv"] },
      seasons: { type: "array", description: "Season numbers for TV (optional)" }
    }
  },

  check_media_status: {
    description: "Check if media is available, requested, or can be requested",
    parameters: {
      tmdbId: { type: "number", description: "TMDb ID of the media" },
      mediaType: { type: "string", enum: ["movie", "tv"] }
    }
  },

  get_requests: {
    description: "Get pending or recent media requests",
    parameters: {
      filter: { type: "string", enum: ["all", "pending", "approved", "available"] }
    }
  }
}
```
