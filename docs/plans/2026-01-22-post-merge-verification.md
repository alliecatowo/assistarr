# Post-Merge Feature Verification Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Verify all features from the consolidated worktree branches work correctly after merging into develop.

**Architecture:** Systematic verification of three feature areas: (1) Home Dashboard, (2) MCP Server Support, (3) Skills System. Each area gets functional testing via dev server, then visual regression testing via Ladle.

**Tech Stack:** Next.js 15, Vercel AI SDK, Drizzle ORM, Ladle for visual testing, Playwright for E2E

---

## Prerequisites

**Step 1: Ensure dev server is running**

Run: `pnpm dev`
Expected: Server starts on http://localhost:3000

**Step 2: Verify database migrations are current**

Run: `pnpm db:generate && pnpm db:migrate`
Expected: No new migrations needed, or migrations applied successfully

---

## Task 1: Verify Home Dashboard

**Files:**
- Test: `app/(chat)/page.tsx`
- Component: `components/home/home-dashboard.tsx`
- Route: `app/(chat)/chat/new/page.tsx`

**Step 1: Navigate to home page**

Open: http://localhost:3000/
Expected: Redirects to login if not authenticated, otherwise shows home dashboard

**Step 2: Verify hero section renders**

Look for:
- "Assistarr Home" header with sparkles icon
- Welcome greeting
- "Everything now in one adaptive canvas" heading
- Three action buttons: "Start a chat", "Discover", "Monitor"
- Four stat cards: Services online, Library footprint, Active downloads, AI signals

**Step 3: Test "Start a chat" navigation**

Click: "Start a chat" button
Expected: Navigates to `/chat/new` and creates a new chat session

**Step 4: Verify widget toggles work**

In Plugin Deck section:
- Click any widget toggle (e.g., "Signals & Uptime")
- Expected: Widget toggles off/on, badge changes between "On"/"Off"
- Refresh page
- Expected: Toggle state persists (saved to localStorage)

**Step 5: Commit verification result**

```bash
echo "Home Dashboard: VERIFIED $(date)" >> docs/plans/verification-results.md
git add docs/plans/verification-results.md
git commit -m "docs: verify home dashboard works"
```

---

## Task 2: Verify MCP Settings Page

**Files:**
- Route: `app/(chat)/settings/mcp/page.tsx`
- API: `app/(chat)/api/settings/mcp/route.ts`
- Queries: `lib/db/queries/mcp-config.ts`

**Step 1: Navigate to MCP settings**

Open: http://localhost:3000/settings/mcp
Expected: Page loads without errors

**Step 2: Verify empty state**

Look for:
- "MCP Servers" heading
- Empty state message or list of configured servers
- "Add Server" or similar button

**Step 3: Test add server form (if available)**

Click: Add server button
Expected: Form appears with fields for:
- Server name
- URL
- Transport type (SSE/HTTP)
- API key (optional)

**Step 4: Verify form validation**

Submit empty form
Expected: Validation errors appear for required fields

**Step 5: Commit verification result**

```bash
echo "MCP Settings: VERIFIED $(date)" >> docs/plans/verification-results.md
git add docs/plans/verification-results.md
git commit -m "docs: verify mcp settings page works"
```

---

## Task 3: Verify Skills Settings Page

**Files:**
- Route: `app/(chat)/settings/skills/page.tsx`
- API: `app/(chat)/api/settings/skills/route.ts`
- Queries: `lib/db/queries/user-skill.ts`

**Step 1: Navigate to Skills settings**

Open: http://localhost:3000/settings/skills
Expected: Page loads without errors

**Step 2: Verify empty state**

Look for:
- "Skills" heading
- Empty state or list of configured skills
- "Add Skill" or similar button

**Step 3: Test add skill form (if available)**

Click: Add skill button
Expected: Form appears with fields for:
- Skill name
- Description
- Content/template

**Step 4: Commit verification result**

```bash
echo "Skills Settings: VERIFIED $(date)" >> docs/plans/verification-results.md
git add docs/plans/verification-results.md
git commit -m "docs: verify skills settings page works"
```

---

## Task 4: Verify Discover Page

**Files:**
- Route: `app/(chat)/discover/page.tsx`
- Utility: `lib/discover/fetch-discovery-sections.ts`

**Step 1: Navigate to Discover page**

Open: http://localhost:3000/discover
Expected: Page loads without errors

**Step 2: Verify content sections**

Look for:
- Discover sections (trending, upcoming, etc.)
- Media cards with posters
- OR empty state if Jellyseerr not configured

**Step 3: Test media card interaction**

Click: Any media card
Expected: Expands to show details or navigates to detail view

**Step 4: Commit verification result**

```bash
echo "Discover Page: VERIFIED $(date)" >> docs/plans/verification-results.md
git add docs/plans/verification-results.md
git commit -m "docs: verify discover page works"
```

---

## Task 5: Verify Settings Navigation

**Files:**
- Layout: `app/(chat)/settings/layout.tsx`
- Routes: `app/(chat)/settings/*/page.tsx`

**Step 1: Navigate to settings**

Open: http://localhost:3000/settings
Expected: Settings page loads with navigation

**Step 2: Verify all settings tabs exist**

Expected tabs/links:
- Plugins (original settings)
- AI
- AI Keys
- MCP
- Skills

**Step 3: Test tab navigation**

Click each tab
Expected: Each page loads without errors

**Step 4: Commit verification result**

```bash
echo "Settings Navigation: VERIFIED $(date)" >> docs/plans/verification-results.md
git add docs/plans/verification-results.md
git commit -m "docs: verify settings navigation works"
```

---

## Task 6: Run Visual Regression Tests

**Files:**
- Config: `.ladle/config.mjs`
- Stories: `components/**/*.stories.tsx`
- Test: `tests/visual/snapshot.spec.ts`

**Step 1: Build Ladle**

Run: `pnpm ladle:build`
Expected: Build completes successfully

**Step 2: Start Ladle preview server**

Run: `pnpm ladle:preview &`
Expected: Server starts on http://localhost:61000

**Step 3: Verify stories render**

Open: http://localhost:61000
Expected: Ladle interface loads with component stories

**Step 4: Run visual tests**

Run: `pnpm test:visual`
Expected: All snapshots match or new baselines generated

**Step 5: Update snapshots if needed**

If tests fail due to intentional changes:
Run: `pnpm exec playwright test tests/visual/ --update-snapshots`

**Step 6: Commit verification result**

```bash
echo "Visual Tests: VERIFIED $(date)" >> docs/plans/verification-results.md
git add docs/plans/verification-results.md
git commit -m "docs: verify visual regression tests pass"
```

---

## Task 7: Final Build Verification

**Step 1: Run production build**

Run: `pnpm build`
Expected: Build completes without errors

**Step 2: Run type check**

Run: `pnpm exec tsc --noEmit`
Expected: No type errors

**Step 3: Run linter**

Run: `pnpm lint`
Expected: No lint errors

**Step 4: Final commit**

```bash
echo "Final Build: VERIFIED $(date)" >> docs/plans/verification-results.md
echo "All verifications complete!" >> docs/plans/verification-results.md
git add docs/plans/verification-results.md
git commit -m "docs: complete post-merge verification"
```

---

## Verification Checklist Summary

| Feature | Status |
|---------|--------|
| Home Dashboard | ⬜ |
| MCP Settings | ⬜ |
| Skills Settings | ⬜ |
| Discover Page | ⬜ |
| Settings Navigation | ⬜ |
| Visual Tests | ⬜ |
| Production Build | ⬜ |

---

## Troubleshooting

### Database errors
- Run `pnpm db:push` to sync schema
- Check `DATABASE_URL` in `.env.local`

### MCP module not found
- Run `pnpm install` to ensure @ai-sdk/mcp is installed

### Visual test failures
- Review screenshot diffs in `test-results/`
- Update baselines if changes are intentional
