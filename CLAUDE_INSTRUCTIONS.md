# Assistarr Project Setup - Claude Code Orchestration Prompt

## Project Context

You are setting up **Assistarr**, an AI-powered home media server management interface built on top of the Vercel AI Chatbot template. The project is already cloned and the AI API key is configured.

## Critical Rules

1. **ALWAYS use pnpm** - never npm or yarn
2. **Use mise** for tool and environment management (mise MCP is available)
3. **Use uv** for any Python tooling
4. **Act as HIGH-LEVEL ORCHESTRATOR only** - delegate all implementation work to subagents
5. **Never be destructive** when interacting with production services
6. **Document everything** - create robust docs that can be passed between agents
7. **Provider is Google Gemini** - use `gemini-2.5-flash` as the default model

## Available MCP Tools

You have access to:
- **Chrome MCP** - for browser automation and testing
- **Vercel MCP** - logged in, for deployment management
- **Neon MCP** - logged in, for database management
- **mise MCP** - for tool/environment management

## Service Endpoints (Production - READ ONLY for now)

- **Sonarr**: https://sonarr.allisons.dev
- **Radarr**: https://radarr.allisons.dev  
- **Jellyfin**: https://jellyfin.allisons.dev
- **Jellyseerr**: https://request.allisons.dev

## Phase 1: Environment & Database Setup

### Subagent Task 1.1: Local Development Environment
Spawn a subagent to:
1. Use mise to ensure Node.js 20+ is installed
2. Run `pnpm install` if not already done
3. Verify the project runs with `pnpm dev`
4. Document the local dev setup in `docs/SETUP.md`

### Subagent Task 1.2: Database Configuration
Spawn a subagent to:
1. Use Neon MCP to create a new database called `assistarr-dev`
2. Get the connection string from Neon
3. Configure local SQLite/better-sqlite3 for local dev (check what the template uses)
4. Set up Drizzle ORM migrations if the template uses it
5. Update `.env.local` with both local and Neon connection strings
6. Document database schema decisions in `docs/DATABASE.md`

### Subagent Task 1.3: Gemini Provider Configuration
Spawn a subagent to:
1. Update the AI SDK configuration to use Google Gemini
2. Set `gemini-2.5-flash` as the default model
3. Verify streaming works correctly
4. Test tool calling with a simple test tool
5. Document provider setup in `docs/AI_PROVIDER.md`

## Phase 2: Service API Investigation

### Subagent Task 2.1: Radarr API Deep Dive
Spawn a subagent to:
1. Use Chrome MCP to visit https://radarr.allisons.dev
2. Navigate to Settings > General to find/document the API key location
3. Research the Radarr API v3 documentation thoroughly
4. Document ALL relevant endpoints in `docs/apis/RADARR_API.md`:
   - Movie search/lookup
   - Movie add/remove
   - Quality profiles
   - Root folders
   - Queue management
   - Calendar/upcoming
   - System status
5. Note rate limits, auth requirements, webhook capabilities

### Subagent Task 2.2: Sonarr API Deep Dive
Spawn a subagent to:
1. Use Chrome MCP to visit https://sonarr.allisons.dev
2. Navigate to Settings > General to find/document the API key location
3. Research the Sonarr API v3 documentation thoroughly
4. Document ALL relevant endpoints in `docs/apis/SONARR_API.md`:
   - Series search/lookup
   - Series add/remove
   - Episode management
   - Quality profiles
   - Root folders
   - Queue management
   - Calendar/upcoming
   - System status
5. Note rate limits, auth requirements, webhook capabilities

### Subagent Task 2.3: Jellyfin API Deep Dive
Spawn a subagent to:
1. Use Chrome MCP to visit https://jellyfin.allisons.dev
2. Research Jellyfin API documentation
3. Document ALL relevant endpoints in `docs/apis/JELLYFIN_API.md`:
   - Library browsing
   - Media playback info
   - User sessions
   - Recently added
   - Continue watching
   - Search
5. Note authentication flow (API key vs user auth)

### Subagent Task 2.4: Jellyseerr API Deep Dive
Spawn a subagent to:
1. Use Chrome MCP to visit https://request.allisons.dev
2. Research Jellyseerr/Overseerr API documentation
3. Document ALL relevant endpoints in `docs/apis/JELLYSEERR_API.md`:
   - Request management
   - Search (integrates with TMDb)
   - User management
   - Status/availability
5. Note how it integrates with Radarr/Sonarr

### Subagent Task 2.5: Existing MCP Server Research
Spawn a subagent to:
1. Search GitHub for existing MCP servers for Radarr, Sonarr, Jellyfin, *arr
2. Evaluate any found servers for:
   - Completeness of API coverage
   - Maintenance status
   - Code quality
   - License compatibility
3. Document findings in `docs/MCP_RESEARCH.md`
4. Recommend: build custom vs use existing vs fork+extend

## Phase 3: MCP Server Implementation

Based on Phase 2 research, spawn subagents for implementation:

### Subagent Task 3.1: Radarr MCP Server
If building custom, spawn a subagent to:
1. Create `packages/radarr-mcp/` directory
2. Implement MCP server with TypeScript
3. Implement tools:
   - `search_movies` - Search for movies by title
   - `get_movie` - Get movie details by ID
   - `add_movie` - Add movie to library (with quality profile)
   - `get_queue` - Get download queue
   - `get_calendar` - Get upcoming releases
   - `get_quality_profiles` - List available profiles
   - `get_root_folders` - List root folders
4. Include proper error handling and rate limiting
5. Write tests
6. Document in `packages/radarr-mcp/README.md`

### Subagent Task 3.2: Sonarr MCP Server
Similar structure for Sonarr with tools:
- `search_series` - Search for TV series
- `get_series` - Get series details
- `add_series` - Add series to library
- `get_episodes` - Get episodes for a series
- `get_queue` - Get download queue
- `get_calendar` - Get upcoming episodes
- `get_quality_profiles` - List available profiles

### Subagent Task 3.3: Jellyfin MCP Server
Similar structure for Jellyfin with tools:
- `get_libraries` - List media libraries
- `search_media` - Search across libraries
- `get_recently_added` - Get recently added items
- `get_continue_watching` - Get in-progress items
- `get_item_details` - Get full media details

### Subagent Task 3.4: Unified Assistarr MCP Server
Create a unified server that combines all services:
1. Create `packages/assistarr-mcp/` 
2. Import and re-export all individual service tools
3. Add meta-tools:
   - `recommend_movie` - AI-powered recommendation
   - `recommend_series` - AI-powered recommendation
   - `media_status` - Check if something is available/requested/downloading
4. This becomes the single MCP endpoint for the chat interface

## Phase 4: Chat Interface Integration

### Subagent Task 4.1: Tool Integration
Spawn a subagent to:
1. Register all MCP tools with the AI SDK
2. Configure tool descriptions for optimal LLM understanding
3. Set up tool result rendering in the chat UI
4. Test each tool through the chat interface
5. Document tool usage patterns in `docs/TOOLS.md`

### Subagent Task 4.2: UI Customization
Spawn a subagent to:
1. Update branding to "Assistarr"
2. Add a settings page for service configuration (API keys, URLs)
3. Store service configs in the database
4. Add visual indicators for service status
5. Create custom message components for media cards

### Subagent Task 4.3: System Prompt Engineering
Spawn a subagent to:
1. Create an optimized system prompt for media management
2. Include context about available tools
3. Add personality/assistant behavior guidelines
4. Test various user scenarios
5. Document in `docs/SYSTEM_PROMPT.md`

## Phase 5: Testing & Deployment

### Subagent Task 5.1: E2E Testing
Spawn a subagent to:
1. Use Chrome MCP to test the full flow:
   - Start local dev server
   - Open chat interface
   - Test "What movies are coming soon?"
   - Test "Add [movie name] to my library"
   - Test "What's downloading right now?"
2. Document test scenarios in `docs/TESTING.md`

### Subagent Task 5.2: Vercel Deployment
Spawn a subagent to:
1. Use Vercel MCP to create a new project
2. Connect the GitHub repository
3. Configure environment variables
4. Set up the Neon database connection
5. Deploy and verify
6. Document deployment in `docs/DEPLOYMENT.md`

## File Structure Goal

```
assistarr/
├── app/                          # Next.js app (from template)
├── components/                   # UI components
├── lib/                          # Shared utilities
├── packages/
│   ├── radarr-mcp/              # Radarr MCP server
│   ├── sonarr-mcp/              # Sonarr MCP server
│   ├── jellyfin-mcp/            # Jellyfin MCP server
│   └── assistarr-mcp/           # Unified MCP server
├── docs/
│   ├── SETUP.md                 # Local dev setup
│   ├── DATABASE.md              # Database schema
│   ├── AI_PROVIDER.md           # Gemini configuration
│   ├── TOOLS.md                 # Tool usage guide
│   ├── SYSTEM_PROMPT.md         # System prompt docs
│   ├── TESTING.md               # Test scenarios
│   ├── DEPLOYMENT.md            # Deployment guide
│   ├── MCP_RESEARCH.md          # MCP server research
│   └── apis/
│       ├── RADARR_API.md
│       ├── SONARR_API.md
│       ├── JELLYFIN_API.md
│       └── JELLYSEERR_API.md
├── .env.local                   # Local environment
├── .env.example                 # Example env file
└── mise.toml                    # mise configuration
```

## Orchestration Instructions

As the orchestrator, you should:

1. **Start with Phase 1** - Get the basics working first
2. **Run Phase 2 tasks in parallel** - API investigation can happen simultaneously
3. **Wait for Phase 2 completion** before starting Phase 3
4. **Review all documentation** produced by subagents before proceeding
5. **Create a master `docs/ARCHITECTURE.md`** that ties everything together
6. **Maintain a `PROGRESS.md`** file tracking what's done and what's pending

## Safety Guardrails

When interacting with production services:
- **READ operations only** until explicitly authorized
- **Never delete** anything without explicit confirmation
- **Log all API calls** for debugging
- **Use test/dry-run modes** where available
- **Prefer staging/development** endpoints if they exist

## Success Criteria

The project is complete when:
1. ✅ Local dev environment works with `pnpm dev`
2. ✅ Chat interface connects to Gemini and streams responses
3. ✅ All *arr service APIs are documented
4. ✅ MCP servers are implemented and tested
5. ✅ User can ask "What's downloading?" and get real data
6. ✅ User can ask "Add [movie] to my library" and it works
7. ✅ Deployed to Vercel with Neon database
8. ✅ All documentation is complete and coherent

---

## BEGIN ORCHESTRATION

Start by:
1. Reading the current project structure
2. Checking what's already configured
3. Creating the `docs/` directory structure
4. Spawning Phase 1 subagents

Report back with a status update after initial assessment.
