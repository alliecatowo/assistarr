# Assistarr Testing Guide

This document provides comprehensive testing documentation for Assistarr, including E2E tests, manual testing procedures, and test results.

## Table of Contents

1. [Test Setup](#test-setup)
2. [Running Tests](#running-tests)
3. [Test Structure](#test-structure)
4. [E2E Test Coverage](#e2e-test-coverage)
5. [Manual Testing Checklist](#manual-testing-checklist)
6. [Mock Data](#mock-data)
7. [Troubleshooting](#troubleshooting)

---

## Test Setup

### Prerequisites

- Node.js 18+
- pnpm 9.12.3+
- Playwright browsers installed

### Installing Dependencies

```bash
# Install project dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install
```

### Environment Configuration

Create a `.env.local` file with the following variables for local testing:

```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/assistarr

# Authentication
AUTH_SECRET=your-auth-secret

# Optional: Service configurations (for integration testing with real services)
# These are not required for E2E tests as they use mocked responses
```

---

## Running Tests

### All E2E Tests

```bash
pnpm test
# or
pnpm exec playwright test
```

### Specific Test File

```bash
pnpm exec playwright test tests/e2e/radarr.spec.ts
```

### Specific Test

```bash
pnpm exec playwright test -g "can search for movies via chat"
```

### With UI Mode

```bash
pnpm exec playwright test --ui
```

### Generate HTML Report

```bash
pnpm exec playwright test --reporter=html
pnpm exec playwright show-report
```

### Debug Mode

```bash
pnpm exec playwright test --debug
```

---

## Test Structure

```
tests/
├── e2e/
│   ├── auth.test.ts           - Authentication page tests
│   ├── chat.test.ts           - Basic chat functionality
│   ├── api.test.ts            - Chat API integration
│   ├── model-selector.test.ts - Model selection tests
│   ├── settings.spec.ts       - Service configuration tests
│   ├── navigation.spec.ts     - App navigation tests
│   ├── radarr.spec.ts         - Radarr tool integration
│   ├── sonarr.spec.ts         - Sonarr tool integration
│   ├── jellyfin.spec.ts       - Jellyfin tool integration
│   ├── jellyseerr.spec.ts     - Jellyseerr tool integration
│   └── qbittorrent.spec.ts    - qBittorrent tool integration
├── fixtures/
│   └── test-data.ts           - Mock data for all tests
├── pages/
│   └── chat.ts                - Page object model for chat
├── prompts/
│   └── utils.ts               - Prompt utilities
├── fixtures.ts                - Playwright fixtures
└── helpers.ts                 - Test helper functions
```

---

## E2E Test Coverage

### Authentication Tests (`auth.test.ts`)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Login page renders | Verify login form elements | Email, password inputs and sign-in button visible |
| Register page renders | Verify registration form | Form elements visible |
| Navigate login to register | Click sign up link | Redirect to /register |
| Navigate register to login | Click sign in link | Redirect to /login |

### Chat Tests (`chat.test.ts`, `api.test.ts`)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Home page loads | Chat input visible | Multimodal input displayed |
| Can type in input | Fill input field | Value reflected |
| Submit button visible | Send button present | Button visible |
| Suggested actions visible | Empty chat shows suggestions | Suggestions displayed |
| Sends message and receives AI response | Submit message | Assistant response appears |
| Redirects to /chat/:id | After sending message | URL changes to chat ID format |
| Clears input after sending | Submit message | Input cleared |
| Shows stop button during generation | While AI responds | Stop button visible |
| Handles API error gracefully | Mock 500 error | Error message displayed |

### Settings Tests (`settings.spec.ts`)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Settings page loads | Navigate to /settings | Title and description visible |
| All service cards visible | Check for all services | Radarr, Sonarr, Jellyfin, Jellyseerr cards present |
| Form fields present | Check inputs | URL and API Key inputs visible |
| Can enter configuration | Fill form fields | Values entered correctly |
| Enabled toggle exists | Check toggle switches | Toggle for each service |
| Save button present | Check save buttons | 4 save buttons (one per service) |
| Shows error without required fields | Try save empty | Error toast displayed |
| Fetches existing configurations | Mock GET response | Fields populated |
| Saves configuration successfully | Mock POST response | Success toast displayed |
| Handles save error | Mock 500 response | Error toast displayed |
| Can toggle service enabled | Click toggle | State changes |
| Can remove configuration | Click remove | Config removed, success toast |

### Navigation Tests (`navigation.spec.ts`)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Home page loads with chat | Navigate to / | Chat interface visible |
| Sidebar contains navigation | Check sidebar | Assistarr title visible |
| Navigate to settings | Click settings link | Redirect to /settings |
| Assistarr logo navigates home | Click logo | Redirect to / |
| New chat button creates session | Click new chat | Fresh chat page |
| Sidebar shows history | Check content area | History section visible |
| User nav visible when logged in | Check nav button | User nav present |
| Theme toggle available | Open user menu | Theme option visible |
| Mobile sidebar toggle | Resize viewport | Toggle works |
| 404 for non-existent routes | Navigate to invalid | 404 returned |

### Radarr Tests (`radarr.spec.ts`)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Can search for movies | Ask to search movies | Response with movie info |
| Can ask about download queue | Ask about queue | Queue information returned |
| Can ask about upcoming movies | Ask about calendar | Calendar data returned |
| Handles service unavailable | Mock 503 error | Graceful error handling |
| Handles invalid API key | Mock 401 error | Error handled |
| Tools unavailable when disabled | Disable service | Service not used |
| Tools unavailable when not configured | No config | Works without Radarr |
| Add movie shows approval | Request to add movie | Approval interface shown |

### Sonarr Tests (`sonarr.spec.ts`)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Can search for TV series | Ask to search series | Response with series info |
| Can ask about download queue | Ask about TV queue | Queue information returned |
| Can ask about upcoming episodes | Ask about calendar | Episode data returned |
| Handles service unavailable | Mock 503 error | Graceful error handling |
| Handles connection timeout | Mock timeout | Timeout handled |
| Tools unavailable when disabled | Disable service | Service not used |
| Add series shows approval | Request to add series | Approval interface shown |
| Combined download queries | Ask about all downloads | Handles multiple services |

### Jellyfin Tests (`jellyfin.spec.ts`)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Can search media in library | Search for movie | Response with media info |
| Can ask about continue watching | Ask what was watching | Resume info returned |
| Can ask about recently added | Ask for recent additions | Recent content listed |
| Handles service unavailable | Mock 503 error | Graceful error handling |
| Handles invalid API token | Mock 401 error | Error handled |
| Tools unavailable when disabled | Disable service | Service not used |
| Can ask about specific movie | Query specific title | Response about that movie |
| Can get watch progress | Ask about progress | Progress information |

### Jellyseerr Tests (`jellyseerr.spec.ts`)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Can search content to request | Search for movies | Search results returned |
| Can ask about existing requests | Query requests | Request list returned |
| Can request media | Request a movie | Request processed |
| Handles service unavailable | Mock 503 error | Graceful error handling |
| Handles invalid API key | Mock 401 error | Error handled |
| Tools unavailable when disabled | Disable service | Service not used |
| Can check request status | Query request status | Status returned |
| Request shows approval interface | Request media | Approval flow shown |

### qBittorrent Tests (`qbittorrent.spec.ts`)

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| Can ask about active torrents | Query torrents | Torrent list returned |
| Can ask about download speeds | Query speeds | Transfer info returned |
| Handles service unavailable | Mock 503 error | Graceful error handling |
| Handles authentication failure | Mock auth fail | Error handled |
| Handles connection timeout | Mock timeout | Timeout handled |
| Tools unavailable when disabled | Disable service | Service not used |
| Can ask about specific torrent | Query specific download | Status returned |
| Can ask about download progress | Query progress | Progress info |
| Pause torrent shows approval | Request pause | Approval interface |
| Resume torrent works | Request resume | Torrents resumed |

---

## Manual Testing Checklist

### Authentication Flow

- [ ] Navigate to /login
- [ ] Enter valid email format
- [ ] Enter password
- [ ] Click "Sign In"
- [ ] Verify redirect to home page
- [ ] Check user email in sidebar
- [ ] Click user nav to see menu
- [ ] Sign out and verify redirect

### Chat Functionality

- [ ] Type message in input
- [ ] Click send button
- [ ] Verify message appears in chat
- [ ] Wait for AI response
- [ ] Verify response appears
- [ ] Check URL changed to /chat/:id
- [ ] Click suggested action
- [ ] Verify new message sent
- [ ] Try stop button during response

### Service Configuration

- [ ] Navigate to /settings
- [ ] For each service (Radarr, Sonarr, Jellyfin, Jellyseerr):
  - [ ] Enter Base URL
  - [ ] Enter API Key
  - [ ] Toggle enabled/disabled
  - [ ] Click Save
  - [ ] Verify success toast
  - [ ] Refresh page
  - [ ] Verify values persisted
  - [ ] Click Remove
  - [ ] Verify removal toast

### Radarr Integration

- [ ] Configure Radarr in settings
- [ ] Ask: "Search for the movie Inception"
- [ ] Verify search results returned
- [ ] Ask: "Show my download queue"
- [ ] Verify queue displayed
- [ ] Ask: "What movies are coming soon?"
- [ ] Verify calendar shown
- [ ] Ask: "Add [movie name] to my library"
- [ ] Verify approval flow (if implemented)

### Sonarr Integration

- [ ] Configure Sonarr in settings
- [ ] Ask: "Search for Breaking Bad"
- [ ] Verify series results
- [ ] Ask: "Show TV download queue"
- [ ] Verify queue displayed
- [ ] Ask: "What episodes air this week?"
- [ ] Verify calendar shown
- [ ] Ask: "Add [show name] to my library"
- [ ] Verify approval flow

### Jellyfin Integration

- [ ] Configure Jellyfin in settings
- [ ] Ask: "Search my library for [title]"
- [ ] Verify search results
- [ ] Ask: "What was I watching?"
- [ ] Verify continue watching
- [ ] Ask: "Show recently added"
- [ ] Verify recent additions

### Jellyseerr Integration

- [ ] Configure Jellyseerr in settings
- [ ] Ask: "Search for movies to request"
- [ ] Verify search results
- [ ] Ask: "Show my requests"
- [ ] Verify request list
- [ ] Ask: "Request [movie name]"
- [ ] Verify request submitted

### qBittorrent Integration

- [ ] Configure qBittorrent in settings
- [ ] Ask: "Show my downloads"
- [ ] Verify torrent list
- [ ] Ask: "What are my download speeds?"
- [ ] Verify transfer info
- [ ] Ask: "Pause all downloads"
- [ ] Verify action (with approval if needed)

### Error Handling

- [ ] Disable a configured service
- [ ] Try to use disabled service
- [ ] Verify graceful handling
- [ ] Enter invalid API key
- [ ] Try to use service
- [ ] Verify error message
- [ ] Disconnect network
- [ ] Verify timeout handling

### Responsive Design

- [ ] Test on mobile viewport (375x667)
- [ ] Test on tablet viewport (768x1024)
- [ ] Test on desktop viewport (1280x800)
- [ ] Verify sidebar toggle on mobile
- [ ] Verify chat input usability

---

## Mock Data

Mock data is defined in `tests/fixtures/test-data.ts` and includes:

### Service Configurations
- Radarr: localhost:7878
- Sonarr: localhost:8989
- Jellyfin: localhost:8096
- Jellyseerr: localhost:5055
- qBittorrent: localhost:8080

### Sample Data
- Movies: Inception, The Matrix
- Series: Breaking Bad
- Queue items with progress
- Calendar entries for upcoming releases
- Jellyfin media library items
- Jellyseerr requests
- Torrent downloads

---

## Troubleshooting

### Common Issues

**Tests fail with "Target closed" error**
- Increase timeout in playwright.config.ts
- Check if dev server is running

**Network requests not mocked**
- Verify route patterns match actual URLs
- Check if routes are set up before navigation

**Flaky tests**
- Add appropriate waitFor conditions
- Use more specific selectors
- Increase timeouts for async operations

**Authentication required**
- Tests may need authenticated session
- Mock auth endpoints or use test user

### Debug Tips

```bash
# Run with headed browser
pnpm exec playwright test --headed

# Pause on failure
pnpm exec playwright test --debug

# Generate trace
pnpm exec playwright test --trace on

# View trace
pnpm exec playwright show-trace trace.zip
```

### Viewing Test Results

After running tests, view the HTML report:

```bash
pnpm exec playwright show-report
```

---

## Test Results Template

### Test Run: [DATE]

| Category | Passed | Failed | Skipped |
|----------|--------|--------|---------|
| Auth | | | |
| Chat | | | |
| Settings | | | |
| Navigation | | | |
| Radarr | | | |
| Sonarr | | | |
| Jellyfin | | | |
| Jellyseerr | | | |
| qBittorrent | | | |
| **Total** | | | |

### Notes
-
-
-

### Screenshots
[Include screenshots of failures or important test states]

---

## Contributing

When adding new tests:

1. Follow existing patterns in the test files
2. Add mock data to `test-data.ts` if needed
3. Update this documentation with new test cases
4. Run full test suite before submitting PR

```bash
pnpm test
```
