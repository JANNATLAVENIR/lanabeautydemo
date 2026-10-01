# LANA Market — Live Admin Sync Fix

## What was fixed
- Storefront now refreshes products, categories, and homepage settings when another browser changes them.
- Supabase Realtime is used as the primary live transport.
- An 8-second polling fallback keeps clients synchronized if Realtime is unavailable.
- Returning to the browser tab triggers an immediate sync.
- Empty database results are now respected; deleting all products/categories no longer silently restores stale in-memory/default data.
- Product and homepage writes no longer report success when the authoritative Supabase write fails.
- The Supabase schema migration enables Realtime for `products`, `categories`, and `homepage_settings` and adds the catalog columns used by the Admin Portal.

## Required Supabase step
Open Supabase SQL Editor and run the complete `supabase-schema.sql` from this project. The bottom section is the live-sync/schema-hardening migration and is safe to run on an existing installation.

## Required environment variables
Server:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (optional PostgreSQL fallback)

Frontend:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend/Vite variables.

## Test
1. Open the storefront in Browser A.
2. Open Admin in Browser B.
3. Edit a product name/price/image and save.
4. Browser A should update without a manual refresh (normally within a second or two through Realtime).
5. If Realtime is unavailable, Browser A will reconcile within 8 seconds.
6. Delete a product and verify it disappears from Browser A.
7. Change homepage settings and verify the open storefront updates.
