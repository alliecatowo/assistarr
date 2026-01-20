# Jellyfin API Documentation

This document covers the Jellyfin API endpoints relevant for the Assistarr chat assistant.

## Base URL Format

```
{JELLYFIN_BASE_URL}/
```

For this project: `https://jellyfin.allisons.dev`

All API endpoints are prefixed with the base URL. The API follows REST conventions and returns JSON responses.

## Authentication

Jellyfin supports two authentication methods:

### 1. API Key Authentication (Server-Level)

API keys provide server-wide access and are suitable for backend services.

**Obtaining an API Key:**
1. Go to Jellyfin Dashboard > Advanced > API Keys
2. Click "+" to create a new key
3. Provide an app name (e.g., "Assistarr")
4. Copy the generated key

**Using the API Key:**

Include in every request header:
```http
Authorization: MediaBrowser Token="{API_KEY}"
```

Or as a query parameter (less secure):
```
?api_key={API_KEY}
```

### 2. User Authentication (User-Level)

User authentication provides access scoped to a specific user's permissions and libraries.

**Step 1: Authenticate User**

```http
POST /Users/AuthenticateByName
Content-Type: application/json
X-Emby-Authorization: MediaBrowser Client="Assistarr", Device="Server", DeviceId="unique-device-id", Version="1.0.0"

{
  "Username": "username",
  "Pw": "password"
}
```

**Response:**
```json
{
  "User": {
    "Name": "username",
    "ServerId": "server-id",
    "Id": "user-id",
    "HasPassword": true,
    "HasConfiguredPassword": true,
    "HasConfiguredEasyPassword": false,
    "EnableAutoLogin": false,
    "Policy": {
      "IsAdministrator": true,
      "IsHidden": false,
      "IsDisabled": false,
      "EnableAllFolders": true,
      ...
    }
  },
  "SessionInfo": {
    "UserId": "user-id",
    "UserName": "username",
    "Client": "Assistarr",
    "DeviceId": "unique-device-id",
    "DeviceName": "Server",
    "Id": "session-id"
  },
  "AccessToken": "access-token-here",
  "ServerId": "server-id"
}
```

**Using the Access Token:**

Include in subsequent requests:
```http
X-Emby-Authorization: MediaBrowser Client="Assistarr", Device="Server", DeviceId="unique-device-id", Version="1.0.0", Token="{ACCESS_TOKEN}"
```

### Common Headers

All requests should include:
```http
X-Emby-Authorization: MediaBrowser Client="Assistarr", Device="Server", DeviceId="unique-device-id", Version="1.0.0", Token="{TOKEN}"
```

Or for API key auth:
```http
Authorization: MediaBrowser Token="{API_KEY}"
```

---

## Key Endpoints

### System Information

#### Get Server Info
```http
GET /System/Info
```

**Response:**
```json
{
  "ServerName": "Jellyfin Server",
  "Version": "10.9.0",
  "Id": "server-id",
  "OperatingSystem": "Linux",
  "HasPendingRestart": false,
  "HasUpdateAvailable": false,
  "StartupWizardCompleted": true
}
```

#### Get Public Server Info (No Auth Required)
```http
GET /System/Info/Public
```

---

### Library Management

#### Get All Libraries (Views)
```http
GET /Users/{userId}/Views
```

**Response:**
```json
{
  "Items": [
    {
      "Name": "Movies",
      "ServerId": "server-id",
      "Id": "library-id",
      "CollectionType": "movies",
      "Type": "CollectionFolder",
      "ImageTags": {
        "Primary": "image-tag"
      }
    },
    {
      "Name": "TV Shows",
      "Id": "library-id-2",
      "CollectionType": "tvshows",
      "Type": "CollectionFolder"
    }
  ],
  "TotalRecordCount": 2
}
```

#### Get Library Items
```http
GET /Users/{userId}/Items
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `ParentId` | string | Library/folder ID to query |
| `IncludeItemTypes` | string | Filter by types: `Movie`, `Series`, `Episode`, `Season` |
| `StartIndex` | int | Pagination offset |
| `Limit` | int | Number of items to return |
| `SortBy` | string | Sort field: `DateCreated`, `SortName`, `PremiereDate`, `DatePlayed`, `CommunityRating` |
| `SortOrder` | string | `Ascending` or `Descending` |
| `Recursive` | bool | Search recursively |
| `Fields` | string | Additional fields: `Overview,Path,Genres,People,Studios,MediaSources` |
| `Filters` | string | Filter flags: `IsUnplayed`, `IsPlayed`, `IsFavorite`, `IsResumable` |
| `SearchTerm` | string | Search query |

**Example - Get Movies:**
```http
GET /Users/{userId}/Items?IncludeItemTypes=Movie&Recursive=true&SortBy=SortName&SortOrder=Ascending&Limit=50
```

**Response:**
```json
{
  "Items": [
    {
      "Name": "Movie Title",
      "ServerId": "server-id",
      "Id": "item-id",
      "Type": "Movie",
      "RunTimeTicks": 72000000000,
      "ProductionYear": 2024,
      "IsFolder": false,
      "UserData": {
        "PlaybackPositionTicks": 0,
        "PlayCount": 0,
        "IsFavorite": false,
        "Played": false,
        "Key": "item-id"
      },
      "ImageTags": {
        "Primary": "image-tag"
      },
      "CommunityRating": 7.5,
      "OfficialRating": "PG-13",
      "Overview": "Movie description...",
      "Genres": ["Action", "Adventure"],
      "Studios": [{"Name": "Studio Name"}]
    }
  ],
  "TotalRecordCount": 150
}
```

---

### Search

#### Global Search
```http
GET /Search/Hints
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `searchTerm` | string | **Required.** Search query |
| `limit` | int | Max results (default: 20) |
| `includeItemTypes` | string | Filter types: `Movie,Series,Episode,Person` |
| `includePeople` | bool | Include people results |
| `includeMedia` | bool | Include media results |
| `includeGenres` | bool | Include genre results |
| `includeStudios` | bool | Include studio results |
| `includeArtists` | bool | Include artist results |

**Example:**
```http
GET /Search/Hints?searchTerm=inception&includeItemTypes=Movie,Series&limit=10
```

**Response:**
```json
{
  "SearchHints": [
    {
      "ItemId": "item-id",
      "Id": "item-id",
      "Name": "Inception",
      "ProductionYear": 2010,
      "Type": "Movie",
      "PrimaryImageTag": "image-tag",
      "RunTimeTicks": 88560000000,
      "MediaType": "Video"
    }
  ],
  "TotalRecordCount": 1
}
```

#### Items Search (Alternative)
```http
GET /Users/{userId}/Items?SearchTerm={query}&Recursive=true
```

---

### Recently Added

#### Get Recently Added Items
```http
GET /Users/{userId}/Items/Latest
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `Limit` | int | Number of items (default: 20) |
| `ParentId` | string | Library ID to filter by |
| `IncludeItemTypes` | string | Filter: `Movie`, `Episode`, `Series` |
| `Fields` | string | Additional fields to include |
| `EnableImages` | bool | Include image info |
| `ImageTypeLimit` | int | Limit image types returned |

**Example - Get Latest Movies:**
```http
GET /Users/{userId}/Items/Latest?Limit=20&IncludeItemTypes=Movie&Fields=Overview,Genres,CommunityRating
```

**Response:**
```json
[
  {
    "Name": "New Movie",
    "Id": "item-id",
    "Type": "Movie",
    "ProductionYear": 2024,
    "DateCreated": "2024-01-15T10:30:00.0000000Z",
    "Overview": "Description...",
    "Genres": ["Drama"],
    "CommunityRating": 8.2,
    "ImageTags": {
      "Primary": "image-tag"
    }
  }
]
```

---

### Continue Watching (Resume Items)

#### Get Resumable Items
```http
GET /Users/{userId}/Items/Resume
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `Limit` | int | Number of items |
| `MediaTypes` | string | Filter: `Video`, `Audio` |
| `ParentId` | string | Library ID filter |
| `IncludeItemTypes` | string | Filter types |
| `Fields` | string | Additional fields |
| `EnableImages` | bool | Include images |
| `EnableUserData` | bool | Include user data |

**Example:**
```http
GET /Users/{userId}/Items/Resume?Limit=10&MediaTypes=Video&Fields=Overview,Genres,MediaSources
```

**Response:**
```json
{
  "Items": [
    {
      "Name": "Episode Title",
      "Id": "item-id",
      "SeriesName": "Series Name",
      "SeriesId": "series-id",
      "SeasonId": "season-id",
      "Type": "Episode",
      "IndexNumber": 5,
      "ParentIndexNumber": 2,
      "UserData": {
        "PlaybackPositionTicks": 18000000000,
        "PlayedPercentage": 45.5,
        "Played": false
      },
      "RunTimeTicks": 39600000000
    }
  ],
  "TotalRecordCount": 5
}
```

**Note:** `PlaybackPositionTicks` represents the position in ticks (1 tick = 100 nanoseconds = 0.0001 milliseconds). Divide by 10,000,000 to get seconds.

---

### Item Details

#### Get Single Item
```http
GET /Users/{userId}/Items/{itemId}
```

**Response (Movie):**
```json
{
  "Name": "Movie Title",
  "OriginalTitle": "Original Title",
  "Id": "item-id",
  "Type": "Movie",
  "Overview": "Full plot description...",
  "ProductionYear": 2024,
  "PremiereDate": "2024-03-15T00:00:00.0000000Z",
  "CommunityRating": 7.8,
  "OfficialRating": "R",
  "Genres": ["Action", "Thriller"],
  "Studios": [
    {"Name": "Studio Name", "Id": "studio-id"}
  ],
  "People": [
    {
      "Name": "Actor Name",
      "Id": "person-id",
      "Role": "Character Name",
      "Type": "Actor"
    },
    {
      "Name": "Director Name",
      "Id": "person-id",
      "Type": "Director"
    }
  ],
  "RunTimeTicks": 72000000000,
  "MediaSources": [
    {
      "Id": "source-id",
      "Name": "Movie Title",
      "Container": "mkv",
      "Size": 4500000000,
      "Path": "/media/movies/Movie Title (2024)/Movie.mkv",
      "Bitrate": 5000000,
      "VideoType": "VideoFile",
      "MediaStreams": [
        {
          "Type": "Video",
          "Codec": "hevc",
          "Width": 3840,
          "Height": 2160,
          "AspectRatio": "16:9",
          "BitRate": 4500000
        },
        {
          "Type": "Audio",
          "Codec": "truehd",
          "Language": "eng",
          "Channels": 8,
          "BitRate": 400000
        },
        {
          "Type": "Subtitle",
          "Codec": "srt",
          "Language": "eng",
          "IsExternal": false
        }
      ]
    }
  ],
  "UserData": {
    "PlaybackPositionTicks": 0,
    "PlayCount": 2,
    "IsFavorite": true,
    "LastPlayedDate": "2024-01-10T20:30:00.0000000Z",
    "Played": true
  },
  "ImageTags": {
    "Primary": "primary-tag",
    "Backdrop": "backdrop-tag"
  },
  "BackdropImageTags": ["backdrop-tag-1", "backdrop-tag-2"]
}
```

#### Get Series Details (with Seasons/Episodes)
```http
GET /Users/{userId}/Items/{seriesId}
```

**Get Seasons:**
```http
GET /Shows/{seriesId}/Seasons?userId={userId}
```

**Get Episodes:**
```http
GET /Shows/{seriesId}/Episodes?userId={userId}&seasonId={seasonId}
```

---

### Playback Information

#### Get Playback Info
```http
GET /Items/{itemId}/PlaybackInfo?userId={userId}
```

**Response:**
```json
{
  "MediaSources": [
    {
      "Id": "source-id",
      "Name": "Movie Title",
      "Container": "mkv",
      "Size": 4500000000,
      "SupportsTranscoding": true,
      "SupportsDirectStream": true,
      "SupportsDirectPlay": true,
      "IsRemote": false,
      "TranscodingUrl": "/videos/item-id/stream...",
      "DirectStreamUrl": "/Videos/item-id/stream?...",
      "MediaStreams": [...]
    }
  ],
  "PlaySessionId": "session-id"
}
```

#### Report Playback Start
```http
POST /Sessions/Playing
Content-Type: application/json

{
  "ItemId": "item-id",
  "MediaSourceId": "source-id",
  "PlaySessionId": "session-id",
  "PositionTicks": 0,
  "CanSeek": true,
  "IsPaused": false,
  "IsMuted": false,
  "VolumeLevel": 100
}
```

#### Report Playback Progress
```http
POST /Sessions/Playing/Progress
Content-Type: application/json

{
  "ItemId": "item-id",
  "MediaSourceId": "source-id",
  "PlaySessionId": "session-id",
  "PositionTicks": 18000000000,
  "IsPaused": false,
  "EventName": "timeupdate"
}
```

#### Report Playback Stopped
```http
POST /Sessions/Playing/Stopped
Content-Type: application/json

{
  "ItemId": "item-id",
  "MediaSourceId": "source-id",
  "PlaySessionId": "session-id",
  "PositionTicks": 72000000000
}
```

---

### Image URLs

Images can be accessed via these URL patterns:

#### Primary Image (Poster)
```
{BASE_URL}/Items/{itemId}/Images/Primary?tag={imageTag}&quality=90&fillWidth=300
```

#### Backdrop
```
{BASE_URL}/Items/{itemId}/Images/Backdrop?tag={imageTag}&quality=90&fillWidth=1920
```

#### Logo
```
{BASE_URL}/Items/{itemId}/Images/Logo?tag={imageTag}
```

#### Thumbnail
```
{BASE_URL}/Items/{itemId}/Images/Thumb?tag={imageTag}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `tag` | string | Image tag for cache busting |
| `quality` | int | JPEG quality (1-100) |
| `fillWidth` | int | Target width |
| `fillHeight` | int | Target height |
| `maxWidth` | int | Maximum width |
| `maxHeight` | int | Maximum height |

---

### User Management

#### Get Current User
```http
GET /Users/Me
```

#### Get All Users (Admin)
```http
GET /Users
```

#### Get User by ID
```http
GET /Users/{userId}
```

---

### Next Up (TV Shows)

#### Get Next Episodes to Watch
```http
GET /Shows/NextUp?userId={userId}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | **Required.** User ID |
| `Limit` | int | Number of items |
| `Fields` | string | Additional fields |
| `SeriesId` | string | Filter to specific series |
| `EnableImages` | bool | Include images |

**Response:**
```json
{
  "Items": [
    {
      "Name": "Episode Title",
      "Id": "episode-id",
      "Type": "Episode",
      "SeriesName": "Series Name",
      "SeriesId": "series-id",
      "SeasonId": "season-id",
      "IndexNumber": 6,
      "ParentIndexNumber": 2,
      "Overview": "Episode description...",
      "RunTimeTicks": 25200000000
    }
  ],
  "TotalRecordCount": 3
}
```

---

### Favorites

#### Mark as Favorite
```http
POST /Users/{userId}/FavoriteItems/{itemId}
```

#### Remove from Favorites
```http
DELETE /Users/{userId}/FavoriteItems/{itemId}
```

---

### Mark as Watched/Unwatched

#### Mark as Played (Watched)
```http
POST /Users/{userId}/PlayedItems/{itemId}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `DatePlayed` | datetime | Optional played date |

#### Mark as Unplayed
```http
DELETE /Users/{userId}/PlayedItems/{itemId}
```

---

## Data Types Reference

### Ticks Conversion
Jellyfin uses ticks for time values (1 tick = 100 nanoseconds):
- **Ticks to Seconds:** `ticks / 10,000,000`
- **Ticks to Minutes:** `ticks / 600,000,000`
- **Minutes to Ticks:** `minutes * 600,000,000`

### Common Item Types
| Type | Description |
|------|-------------|
| `Movie` | Feature films |
| `Series` | TV series container |
| `Season` | Season container |
| `Episode` | TV episode |
| `MusicAlbum` | Music album |
| `Audio` | Music track |
| `BoxSet` | Collection/box set |
| `Person` | Actor/director/etc. |
| `Playlist` | User playlist |
| `CollectionFolder` | Library folder |

### Media Types
| MediaType | Description |
|-----------|-------------|
| `Video` | Movies, TV, etc. |
| `Audio` | Music |
| `Photo` | Images |
| `Book` | eBooks |

---

## Error Handling

### Common HTTP Status Codes
| Code | Meaning |
|------|---------|
| `200` | Success |
| `204` | Success (no content) |
| `400` | Bad request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Item not found |
| `500` | Server error |

### Error Response Format
```json
{
  "message": "Error description",
  "statusCode": 401
}
```

---

## Rate Limiting

Jellyfin does not implement strict rate limiting by default, but:
- Implement reasonable delays between requests (100-200ms)
- Cache responses where appropriate
- Avoid parallel bulk requests

---

## Best Practices for Assistarr

1. **Authentication:** Use API key for server operations; user tokens for personalized data (continue watching, favorites)

2. **Caching:** Cache library/item data for reasonable periods (5-15 minutes for search results)

3. **Image Loading:** Always specify image dimensions to reduce bandwidth

4. **Search:** Use `/Search/Hints` for quick searches; `/Users/{userId}/Items` with `SearchTerm` for filtered searches

5. **Continue Watching:** Check `UserData.PlaybackPositionTicks > 0` to find resumable items

6. **Time Display:** Convert ticks properly for human-readable times

7. **Error Handling:** Always check response status and handle auth failures gracefully

---

## TypeScript Interface Examples

```typescript
interface JellyfinConfig {
  baseUrl: string;
  apiKey?: string;
  accessToken?: string;
  userId?: string;
  deviceId: string;
}

interface MediaItem {
  Id: string;
  Name: string;
  Type: 'Movie' | 'Series' | 'Episode' | 'Season';
  ProductionYear?: number;
  Overview?: string;
  RunTimeTicks?: number;
  CommunityRating?: number;
  OfficialRating?: string;
  Genres?: string[];
  ImageTags?: {
    Primary?: string;
    Backdrop?: string;
  };
  UserData?: {
    PlaybackPositionTicks: number;
    PlayCount: number;
    IsFavorite: boolean;
    Played: boolean;
    LastPlayedDate?: string;
  };
}

interface SearchResult {
  ItemId: string;
  Name: string;
  Type: string;
  ProductionYear?: number;
  PrimaryImageTag?: string;
}

// Helper function
function ticksToMinutes(ticks: number): number {
  return Math.floor(ticks / 600000000);
}

function getImageUrl(baseUrl: string, itemId: string, tag: string, width = 300): string {
  return `${baseUrl}/Items/${itemId}/Images/Primary?tag=${tag}&fillWidth=${width}`;
}
```

---

## References

- Jellyfin API Documentation: https://api.jellyfin.org/
- Jellyfin GitHub Repository: https://github.com/jellyfin/jellyfin
- OpenAPI Specification: `{YOUR_SERVER}/api-docs/swagger/index.html`
