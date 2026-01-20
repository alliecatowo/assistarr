# AI Tools Documentation

This document describes all the AI tools available in Assistarr. These tools enable the AI assistant to interact with various media management services on behalf of the user.

---

## Overview

Tools are registered in the chat API route (`/app/(chat)/api/chat/route.ts`) and are made available to the AI during conversations. Each tool receives the user's session for authentication and accesses the user's service configurations from the database.

### Tool Categories

| Category | Service | Tools |
|----------|---------|-------|
| Movies | Radarr | `searchMovies`, `addMovie`, `getRadarrQueue`, `getRadarrCalendar` |
| TV Shows | Sonarr | `searchSeries`, `addSeries`, `getSonarrQueue`, `getSonarrCalendar` |
| Media Library | Jellyfin | `getContinueWatching`, `getRecentlyAdded`, `searchMedia` |
| Requests | Jellyseerr | `searchContent`, `requestMedia`, `getRequests` |
| Downloads | qBittorrent | `getTorrents`, `getTransferInfo`, `pauseResumeTorrent` |

---

## Radarr Tools

Tools for managing movies through Radarr.

### `searchMovies`

Search for movies by name in the Radarr database.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `query` | string | Yes | The movie name to search for |

**Returns:** List of matching movies with title, year, overview, TMDB ID, ratings, and poster URL.

---

### `addMovie`

Add a movie to the Radarr library for automatic downloading.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `tmdbId` | number | Yes | - | TMDB ID from search results |
| `qualityProfileId` | number | No | First available | Quality profile to use |
| `minimumAvailability` | enum | No | `"released"` | When to consider available: `announced`, `inCinemas`, `released` |
| `searchForMovie` | boolean | No | `true` | Start searching immediately |

**Requires Approval:** Yes

---

### `getRadarrQueue`

Get the current download queue from Radarr.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `includeUnknownMovieItems` | boolean | No | `false` | Include items without movie info |

**Returns:** List of queued items with download progress, status, and ETA.

---

### `getRadarrCalendar`

Get upcoming movie releases from Radarr.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `days` | number | No | `30` | Days to look ahead |
| `includePast` | boolean | No | `false` | Include recent releases |

**Returns:** List of upcoming movies with release dates and types (cinema, digital, physical).

---

## Sonarr Tools

Tools for managing TV series through Sonarr.

### `searchSeries`

Search for TV series by name.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `query` | string | Yes | The TV series name to search for |

**Returns:** List of matching series with title, year, overview, TVDB ID, and season count.

---

### `addSeries`

Add a TV series to the Sonarr library for automatic downloading.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `tvdbId` | number | Yes | - | TVDB ID from search results |
| `qualityProfileId` | number | No | First available | Quality profile to use |
| `monitor` | enum | No | `"all"` | Episodes to monitor: `all`, `future`, `missing`, `existing`, `firstSeason`, `lastSeason`, `pilot`, `none` |
| `searchForMissingEpisodes` | boolean | No | `true` | Start searching immediately |

**Requires Approval:** Yes

---

### `getSonarrQueue`

Get the current download queue from Sonarr.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `includeUnknownSeriesItems` | boolean | No | `false` | Include items without series info |

**Returns:** List of queued episodes with download progress, status, and ETA.

---

### `getSonarrCalendar`

Get upcoming TV episode releases from Sonarr.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `days` | number | No | `7` | Days to look ahead |
| `includePast` | boolean | No | `false` | Include recent episodes |

**Returns:** List of upcoming episodes with air dates and series info.

---

## Jellyfin Tools

Tools for interacting with the Jellyfin media server.

### `getContinueWatching`

Get in-progress (partially watched) content from Jellyfin.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `limit` | number | No | `10` | Maximum items to return (1-25) |

**Returns:** List of in-progress items with progress percentage, remaining time, and thumbnails.

---

### `getRecentlyAdded`

Get recently added content from the Jellyfin library.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `limit` | number | No | `10` | Maximum items to return (1-25) |
| `mediaType` | enum | No | `"all"` | Filter by type: `all`, `Movie`, `Episode`, `Series` |

**Returns:** List of recently added items with titles, dates, and thumbnails.

---

### `searchMedia`

Search for content in the Jellyfin library.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `query` | string | Yes | Search query |
| `limit` | number | No | Maximum results to return |
| `mediaType` | enum | No | Filter by type: `all`, `Movie`, `Series`, `Episode` |

**Returns:** List of matching media items with titles, years, and availability info.

---

## Jellyseerr Tools

Tools for managing media requests through Jellyseerr.

### `searchContent`

Search for movies or TV shows in Jellyseerr.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `query` | string | Yes | - | Search query |
| `type` | enum | No | `"all"` | Filter by type: `all`, `movie`, `tv` |
| `page` | number | No | `1` | Page number for pagination |

**Returns:** List of results with title, year, type, availability status, and poster URL.

---

### `requestMedia`

Request a movie or TV show to be added to the library.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `tmdbId` | number | Yes | - | TMDB ID from search results |
| `mediaType` | enum | Yes | - | Type: `movie` or `tv` |
| `seasons` | number[] | No | All seasons | For TV: specific seasons to request |
| `is4k` | boolean | No | `false` | Request 4K version |

**Requires Approval:** Yes

**Returns:** Request ID, status, and confirmation message.

---

### `getRequests`

Get media requests from Jellyseerr.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `filter` | enum | No | `"all"` | Filter: `all`, `pending`, `approved`, `available`, `processing`, `unavailable` |
| `take` | number | No | `10` | Results per page (max 50) |
| `skip` | number | No | `0` | Results to skip for pagination |

**Returns:** List of requests with titles, status, requestor info, and posters.

---

## qBittorrent Tools

Tools for managing torrents through qBittorrent.

### `getTorrents`

List torrents from qBittorrent.

**Parameters:**
| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `filter` | enum | No | `"all"` | Filter: `all`, `downloading`, `seeding`, `completed`, `paused`, `active`, `inactive`, `resumed`, `stalled`, `errored` |
| `limit` | number | No | `20` | Maximum torrents to return (1-50) |
| `sort` | enum | No | `"added_on"` | Sort by: `name`, `size`, `progress`, `dlspeed`, `upspeed`, `added_on`, `eta` |

**Returns:** List of torrents with name, progress, speeds, ETA, and state.

---

### `getTransferInfo`

Get global transfer statistics from qBittorrent.

**Parameters:** None

**Returns:** Global download/upload speeds, session totals, and connection info.

---

### `pauseResumeTorrent`

Pause or resume a torrent.

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| `hash` | string | Yes | Torrent hash or `"all"` for all torrents |
| `action` | enum | Yes | Action: `pause` or `resume` |

**Requires Approval:** Yes

**Returns:** Confirmation with updated torrent state.

---

## Tool Implementation Pattern

All service tools follow the same pattern:

```typescript
import { tool } from "ai";
import type { Session } from "next-auth";
import { z } from "zod";

type MyToolProps = {
  session: Session;
};

export const myTool = ({ session }: MyToolProps) =>
  tool({
    description: "Tool description for the AI",
    inputSchema: z.object({
      param: z.string().describe("Parameter description"),
    }),
    needsApproval: false, // Set to true for destructive actions
    execute: async ({ param }) => {
      // Access user's service config via session.user.id
      // Make API calls to external service
      // Return structured response
    },
  });
```

### Key Patterns

1. **Session-based Auth**: Tools receive the user session to fetch service configurations
2. **Input Validation**: Zod schemas validate and describe tool parameters
3. **Approval Flow**: Destructive tools set `needsApproval: true` for user confirmation
4. **Error Handling**: Tools catch service errors and return user-friendly messages
5. **Structured Responses**: Tools return objects with data and user-friendly messages

---

## Configuration

Service tools require users to configure their services in the settings page. Each service stores:

- **Base URL**: The service's API endpoint
- **API Key**: Authentication token for the service
- **Enabled**: Whether the service is active

Configuration is stored per-user in the database and accessed via the session's user ID.

---

## Adding New Tools

1. Create tool files in `/lib/ai/tools/services/<service>/`
2. Export from the service's `index.ts`
3. Import and register in `/app/(chat)/api/chat/route.ts`:
   - Add to imports
   - Add tool name to `experimental_activeTools` array
   - Add tool instance to `tools` object with session
4. Update this documentation

See existing tools for implementation examples.
