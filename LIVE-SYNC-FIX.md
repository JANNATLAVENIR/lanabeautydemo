# LANA Market — Shared Data Deployment Checklist

## Sync behavior
- Admin changes are sent to the server API and must be saved in shared Supabase/PostgreSQL storage; browser `localStorage` is not the catalog database.
- The storefront refreshes products, categories, and homepage settings every 5 seconds, and refreshes immediately when a suspended mobile tab becomes visible again.
- Product edits that do not update a shared database row now return an error instead of appearing successful only in one server instance.

## Database setup
Run SQL against the same Supabase project used by the deployed site.
- If `public.products` already exists, run `supabase/migrations/20261002000000_shared_catalog_settings.sql` to add the shared catalog/settings schema.
- For a fresh project, run `supabase-schema.sql` first, then `supabase/migrations/20261002000000_shared_catalog_settings.sql`.
- Do not run `supabase/migrations/20260401000000_production_hardening.sql` yet. It currently expects product columns created by the later migration and its new reviews schema conflicts with the legacy reviews table in `supabase-schema.sql`.

The production-hardening migration needs a compatibility fix before it is safe to apply. The shared catalog migration is separate from the base schema.

## Deployment environment
Set these for the Vercel Production environment, then redeploy:
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for server-side shared writes.
- `ADMIN_SESSION_SECRET` as a unique, high-entropy server-only secret.
- `DATABASE_URL` for PostgreSQL-backed checkout and order persistence; it must target the same Supabase project.
- `ADMIN_PASSWORD` if admin credentials are not provisioned in the database.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the frontend.

Never put `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, or `ADMIN_SESSION_SECRET` in a `VITE_` variable.

## Cross-device verification
1. Open the same deployed URL on two devices.
2. Save a product edit, add a product, and change homepage/social settings from Admin on device A.
3. Device B should show the changes within 5 seconds, or immediately after returning to the site if its tab was suspended.
4. Confirm uploaded media uses a persistent Supabase Storage URL, not a temporary server-instance path.
5. If any save reports an error, check the Vercel function logs and confirm the migrations and Production environment variables above are applied.
