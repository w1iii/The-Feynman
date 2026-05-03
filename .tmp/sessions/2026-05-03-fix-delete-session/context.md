# Task Context: Fix Delete Session Route

Session ID: 2026-05-03-fix-delete-session
Created: 2026-05-03T00:00:00Z
Status: completed

## Current Request
Fix delete session API route that can't delete on deployed website (Linux production server).

## Context Files (Standards to Follow)
- None found (no .opencode/context/ directory)

## Reference Files (Source Material to Look At)
- app/feynman/page.tsx (deleteSession function at line 242)
- app/api/deletesession/[id]/route.ts (backend route handler)
- app/api/session/[id]/route.ts (reference for proper session deletion pattern)

## External Docs Fetched
- None needed (Next.js built-in API routes)

## Components
1. Frontend fetch call in page.tsx
2. Backend DELETE route handler

## Constraints
- Must work on Linux (case-sensitive) production servers
- Must use proper HTTP DELETE method
- Should handle related data cleanup (messages, criteria_results)

## Exit Criteria
- [ ] Frontend fetch uses correct URL casing (/api/deletesession/)
- [ ] Frontend fetch includes method: 'DELETE'
- [ ] Backend route properly deletes session and related data
- [ ] Code works on case-sensitive file systems
