# Task Context: Settings Page

Session ID: 2026-05-03-settings-page
Created: 2026-05-03
Status: in_progress

## Current Request
Create a settings page at `/feynman/settings` with:
- Profile editing (display name)
- Account info (email, change password)
- Learning stats (total sessions, avg score, concepts explored)
- Wire up existing Settings link in sidebar

## Context Files (Standards to Follow)
- No internal context files exist in .opencode/context/
- Follow existing project conventions: co-located CSS, "use client" pages, Supabase SSR auth

## Reference Files (Source Material to Look At)
- app/feynman/page.tsx — Main app page (sidebar, auth patterns, types)
- app/api/profile/route.ts — Profile API (needs PUT extension)
- app/lib/supabase/client.ts — Browser Supabase client
- app/lib/supabase/server.ts — Server Supabase client
- app/middleware.ts — Auth middleware (settings route is under /feynman/ so already protected)
- app/feynman/page.css — Main app styles (follow same CSS conventions)

## External Docs Fetched
None needed — using existing Supabase patterns already in codebase.

## Components
1. **Profile API (PUT)** — Update display name in profiles table
2. **Stats API (GET)** — Aggregate session data for stats display
3. **Settings Page** — Client component with sections: Profile, Account, Stats, Data
4. **Sidebar Navigation** — Wire Settings link to /feynman/settings

## Constraints
- Follow existing project patterns: co-located page.css, "use client" components
- Supabase auth via @supabase/ssr
- profiles table has: user_id, plan (and likely display_name or similar)
- sessions table has: user_id, concept, created_at, status, final_score
- No shared component library — all inline in page files

## Exit Criteria
- [ ] Settings page renders at /feynman/settings
- [ ] Profile display name can be updated
- [ ] Learning stats display correctly
- [ ] Settings link in sidebar navigates to settings page
- [ ] Type check passes
- [ ] Dev server runs without errors
