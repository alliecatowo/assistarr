# MCP Server Research for Home Media Management

This document summarizes research on existing MCP (Model Context Protocol) servers for home media management applications like Radarr, Sonarr, Jellyfin, and Plex. While Assistarr uses AI SDK tools rather than MCP servers, these implementations provide valuable patterns and insights for tool design.

## Summary

| Repository | Stars | Language | Services Supported | Last Updated | Quality |
|------------|-------|----------|-------------------|--------------|---------|
| [aplaceforallmystuff/mcp-arr](https://github.com/aplaceforallmystuff/mcp-arr) | 58 | JS/TS | Sonarr, Radarr, Lidarr, Readarr, Prowlarr | 3 days ago | Excellent |
| [vladimir-tutin/plex-mcp-server](https://github.com/vladimir-tutin/plex-mcp-server) | 75 | Python | Plex | Mar 2025 | Good |
| [wyattjoh/media-server-mcp](https://github.com/wyattjoh/media-server-mcp) | 8 | TypeScript | Radarr, Sonarr, TMDB | 8 days ago | Good |
| [JasonTulp/mcparr-server](https://github.com/jasonTulp/mcparr-server) | 6 | JavaScript | Radarr, Sonarr | Mar 2025 | Moderate |
| [omniwaifu/arr-assistant-mcp](https://github.com/omniwaifu/arr-assistant-mcp) | 5 | Python | Radarr, Sonarr | Jul 2025 | Moderate |
| [PCritchfield/jellyfin-suggestion-mcp](https://github.com/PCritchfield/jellyfin-suggestion-mcp) | 3 | TypeScript | Jellyfin | Nov 2025 | Good |
| [jsp123/ultimarr-mcp](https://github.com/jsp123/ultimarr-mcp) | 0 | Go | Jellyseerr, Sonarr, Radarr | Recent | Basic |
| [felipemeres/radarr-mcp](https://github.com/felipemeres/radarr-mcp) | 0 | Python | Radarr | 5 months ago | Basic |

---

## Detailed Evaluations

### 1. aplaceforallmystuff/mcp-arr (Recommended Reference)

**URL:** https://github.com/aplaceforallmystuff/mcp-arr

**Overview:**
The most comprehensive and actively maintained MCP server for *arr applications. This is the primary reference implementation we should study.

**Stats:**
- Stars: 58
- Forks: 6
- License: MIT
- Latest Release: v1.4.1 (last week)
- Language: JavaScript 64.9%, TypeScript 34.4%

**Services Supported:**
- Sonarr (TV series)
- Radarr (Movies)
- Lidarr (Music)
- Readarr (Books)
- Prowlarr (Indexers)

**Features (30+ tools):**
- **Cross-Service:** Unified search, status checks across all services
- **Sonarr:** List series, view episodes, search shows, trigger downloads, check queue, view calendar
- **Radarr:** List movies, search films, trigger downloads, check queue, view releases
- **Lidarr:** List artists, view albums, search musicians, trigger downloads
- **Readarr:** List authors, view books, search writers, trigger downloads
- **Prowlarr:** List indexers, search across all trackers, test health
- **Configuration:** Quality profiles, download clients, naming conventions, health checks
- **TRaSH Guides:** Integration for quality profiles and recommendations

**Code Quality:**
- Well-structured TypeScript interfaces (994 lines in arr-client.ts)
- Comprehensive type definitions for all services
- JSON schema-based tool definitions (tools.json - 783 lines)
- Docker support with GitHub workflows
- Active development with Claude co-authoring commits

**Key Patterns to Reference:**
```typescript
// Service type definition
export type ArrService = 'sonarr' | 'radarr' | 'lidarr' | 'readarr' | 'prowlarr';

// Configuration interface
export interface ArrConfig {
  url: string;
  apiKey: string;
}

// Common interfaces for status, queue, quality profiles, etc.
export interface SystemStatus {
  appName: string;
  version: string;
  buildTime: string;
  isDebug: boolean;
  isProduction: boolean;
  // ... more fields
}
```

**Tool Definition Pattern:**
```json
{
  "name": "arr_search_all",
  "description": "Search across all configured *arr services for any media",
  "inputSchema": {
    "type": "object",
    "properties": {
      "term": {
        "type": "string",
        "description": "Search term"
      }
    },
    "required": ["term"]
  }
}
```

---

### 2. vladimir-tutin/plex-mcp-server

**URL:** https://github.com/vladimir-tutin/plex-mcp-server

**Overview:**
Most popular Plex MCP server, providing a unified API layer on top of Plex Media Server.

**Stats:**
- Stars: 75
- Forks: 15
- License: Not specified
- Language: Python 100%

**Features:**
- Library browsing and search
- Playback control
- User management
- Media metadata access
- Automation and scripting interface

**Relevance:**
Useful if Assistarr expands to support Plex alongside Jellyfin.

---

### 3. wyattjoh/media-server-mcp

**URL:** https://github.com/wyattjoh/media-server-mcp

**Overview:**
TypeScript-based MCP server using Deno runtime, with TMDB integration for metadata.

**Stats:**
- Stars: 8
- Forks: 2
- License: MIT
- Language: TypeScript 100%

**Features:**
- Radarr integration (movies)
- Sonarr integration (TV series)
- TMDB data access for enriched metadata
- Natural language interactions

**Notable:**
- Uses Deno instead of Node.js
- Includes TMDB integration for external metadata
- Monorepo structure with packages directory

---

### 4. JasonTulp/mcparr-server

**URL:** https://github.com/jasonTulp/mcparr-server

**Overview:**
Focused MCP server for Radarr and Sonarr with health monitoring features.

**Stats:**
- Stars: 6
- Forks: 4
- License: Not specified
- Language: JavaScript 100%

**Features:**
- Browse movie and TV show library
- Search and filter by year/genre
- Request downloads
- Download and monitoring status
- System health monitoring (disk space, health checks, status reporting)

---

### 5. omniwaifu/arr-assistant-mcp

**URL:** https://github.com/omniwaifu/arr-assistant-mcp

**Overview:**
Simple Python-based MCP server focused on adding media to Radarr/Sonarr.

**Stats:**
- Stars: 5
- Forks: 2
- License: Not specified
- Release: v0.1.0 (Jul 12, 2025)
- Language: Python 100%

**Features:**
- Add movies to Radarr
- Add TV shows to Sonarr
- Natural language queries

**Notes:**
- Uses Python 3.12+ and UV package manager
- Minimal feature set - focused on content addition only

---

### 6. PCritchfield/jellyfin-suggestion-mcp

**URL:** https://github.com/PCritchfield/jellyfin-suggestion-mcp

**Overview:**
Jellyfin-focused MCP server for getting movie suggestions based on library content.

**Stats:**
- Stars: 3
- Forks: 0
- License: MIT
- Release: v1.1.0 (Nov 11, 2025)
- Language: TypeScript

**Features:**
- Chat with agent for media suggestions
- Analyze existing library
- Recommendation engine integration

---

### 7. jsp123/ultimarr-mcp

**URL:** https://github.com/jsp123/ultimarr-mcp

**Overview:**
Go-based MCP server covering Jellyseerr, Sonarr, and Radarr.

**Stats:**
- Stars: 0
- Forks: 0
- Language: Go 100%

**Features:**
- Jellyseerr integration (unique among repos)
- Sonarr support
- Radarr support
- Binary distribution

---

## Recommendations

### Primary Reference: aplaceforallmystuff/mcp-arr

**Why:**
1. **Most comprehensive** - Covers all major *arr services
2. **Actively maintained** - Regular updates, v1.4.1 released last week
3. **Well-documented** - Clear README, type definitions, tool schemas
4. **Production quality** - Docker support, CI/CD, proper versioning
5. **MIT licensed** - Can freely reference patterns
6. **TypeScript** - Matches our tech stack

### Build Custom vs Use Existing

**Recommendation: Build custom AI SDK tools, but reference mcp-arr patterns**

**Reasons to build custom:**
1. Assistarr uses AI SDK tools, not MCP protocol
2. Need integration with our existing architecture
3. Want to support additional services (Jellyfin, Overseerr, Tautulli)
4. Need custom business logic for multi-step workflows

**What to reference from existing implementations:**
1. **Tool naming conventions** - e.g., `{service}_{action}` pattern
2. **Input schema design** - JSON Schema definitions for parameters
3. **API endpoint coverage** - Which endpoints are most useful
4. **Type definitions** - Interface patterns for *arr APIs
5. **Error handling patterns** - How to handle API failures gracefully

---

## Useful Patterns for AI SDK Tools

### Tool Naming Convention
```
{service}_{resource}_{action}
Examples:
- radarr_movies_search
- sonarr_series_list
- jellyfin_library_scan
```

### Common Tool Categories
Based on mcp-arr analysis:

1. **Status/Health Tools**
   - Get service status
   - Check health warnings
   - View system info

2. **Library Tools**
   - List content (movies, series, albums)
   - Get details for specific items
   - Search library

3. **Search/Discovery Tools**
   - Search for new content
   - Cross-service unified search
   - Get recommendations

4. **Action Tools**
   - Add content to library
   - Trigger downloads/searches
   - Manage queue

5. **Configuration Tools**
   - View/manage quality profiles
   - Check download clients
   - Review naming conventions

### Type Definitions to Reference

From mcp-arr's arr-client.ts:
- `SystemStatus` - Service health/version info
- `QueueItem` - Download queue entries
- `Series`/`Movie`/`Album` - Content types
- `Episode` - TV episode details
- `QualityProfile` - Quality settings
- `DownloadClient` - Client configuration
- `HealthCheck` - Health warnings

---

## Additional Resources

### API Documentation
- Radarr API: https://radarr.video/docs/api/
- Sonarr API: https://sonarr.tv/docs/api/
- Lidarr API: https://lidarr.audio/docs/api/
- Jellyfin API: https://api.jellyfin.org/
- Servarr Wiki: https://wiki.servarr.com/

### Related Projects
- [TRaSH Guides](https://trash-guides.info/) - Quality profile recommendations
- [Buildarr](https://buildarr.github.io/) - Configuration management for *arr stack

---

## Conclusion

The existing MCP server ecosystem for home media management is relatively mature, with `mcp-arr` being the clear leader for *arr services. For Assistarr's AI SDK tools:

1. **Reference mcp-arr** for tool design patterns, API coverage, and type definitions
2. **Build custom tools** that integrate with AI SDK and our architecture
3. **Expand coverage** to include Jellyfin, Overseerr, and Tautulli
4. **Add workflow tools** for multi-step operations (e.g., "find and add movie")

The research shows that natural language media management is an active and growing space, validating the direction of Assistarr.
