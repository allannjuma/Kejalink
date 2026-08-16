# Kejalink — Continuous Improvement Backlog

Each scheduled run picks the **first unchecked item**, implements it, validates with
`npm run build`, syncs changed files to the Desktop project, checks the item off here,
and appends an entry to `PROGRESS.md`. One item per run — smallest safe scope.

## Rules for every run

- Work in the workspace copy: `C:\Users\hp\Documents\kimi\workspace\kejalink-user\kejalink`
- Build before syncing: `export PATH="/c/Program Files/nodejs:$PATH" && npm run build`
- Sync only files that changed, only if the build passes: `cp` into `C:\Users\hp\Desktop\kejalink\kejalink` (same relative path)
- If the build fails and can't be fixed quickly, restore the touched files from the Desktop copy (last known good) and log the failure in PROGRESS.md
- Always sync `IMPROVEMENTS.md` and `PROGRESS.md` to the Desktop project root too
- Design system: coral user side (`#FF385C` brand, `#111827` ink, `#FFFFFF` paper, `#9CA3AF` muted, tokens in `app/globals.css`); admin keeps its zinc/emerald style
- OFF LIMITS: `app/api/mpesa/**`, `lib/mpesa.ts`, `.env*` files, `supabase/*.sql`, any credentials, deleting existing features

## Backlog (priority order)

- [x] 1. SEO metadata upgrade — title template, keywords, OpenGraph, Twitter card, robots in `app/layout.tsx`
- [x] 2. Custom 404 page `app/not-found.tsx` in the coral user-side theme with links home/search
- [x] 3. Global error boundary `app/error.tsx` with friendly retry UI
- [x] 4. Favorites page `app/favorites/page.tsx` listing saved rooms from the `kejalink-favorites` localStorage key
- [x] 5. Search page: recent-searches chips (localStorage), clear-all, and empty-state polish
- [x] 6. Room page gallery: keyboard arrows navigation + mobile swipe hint + image counter badge
- [x] 7. Accessibility pass: aria-labels on icon-only buttons, visible focus rings, alt text audit on user side
- [x] 8. Card image performance: audit `next/image` usage vs `<img>`, lazy loading, `remotePatterns` in next.config
- [x] 9. Admin buildings page: client-side search/filter box over building name/area/town
- [x] 10. Admin approvals page: select-all + bulk approve action
- [x] 11. Caretaker dashboard: visual polish pass to match overall quality (keep its data logic untouched)
- [x] 12. Final consistency sweep: skeleton loaders everywhere data loads, consistent empty states, `timeAgo` usage

## Notes

- M-Pesa runs in mock mode until `MPESA_CALLBACK_URL` is set — do not "fix" this, it's intentional
- The admin passes dashboard (`/admin/passes`) is complete: stats, stacked chart, day filter, CSV, regulars, auto-refresh
