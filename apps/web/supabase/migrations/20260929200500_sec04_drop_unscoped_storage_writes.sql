-- sec04_drop_unscoped_storage_writes — closes TICKET SEC-04 (HEARTBEAT.md, 2026-09-29 #4).
--
-- Applied via Supabase MCP `apply_migration`.
--
-- ── The hole ──
--
-- `storage.objects` carried five write policies scoped by nothing but "does the
-- request carry a token":
--
--   org_media_auth_insert / _update / _delete     bucket_id = 'org-media'
--   customer_avatars_auth_insert / _update        bucket_id = 'customer-avatars'
--                                                 AND auth.role() = 'authenticated'
--
-- No tenant predicate, no path predicate. Any authenticated user — including a
-- customer who self-registers through the OTP flow — could overwrite or delete
-- any object in those buckets, across every tenant: brand media, gallery photos
-- and customer avatars.
--
-- ── Why dropping them is safe ──
--
-- Every storage write in apps/web/src goes through a service-role client built
-- inline with the service key (`createClient` in settings/brand/actions.ts,
-- settings/profile/actions.ts and customers/actions/upload-avatar.ts). Verified
-- in the database before dropping: `service_role` has BYPASSRLS, and
-- `storage.objects` is owned by `supabase_storage_admin` with FORCE ROW LEVEL
-- SECURITY off, so neither the app's uploads nor the Storage API's own
-- operations consult these policies. Nothing writes with the anon/authenticated
-- client: the only anon-client storage call in the repo is a `createSignedUrl`
-- read.
--
-- ── What is kept, deliberately ──
--
-- The two `*_public_read` SELECT policies stay. All three buckets are public
-- (`storage.buckets.public = true`), so their contents are served from the
-- public URL endpoint regardless; those policies expose nothing the public
-- bucket does not already serve, and dropping them would only risk breaking
-- `getPublicUrl` consumers for no security gain.
--
-- If a future feature needs client-side uploads, add a policy that pins the
-- bucket AND a path rooted in the caller's own tenant — never `auth.role()`
-- alone.

DROP POLICY IF EXISTS org_media_auth_insert        ON storage.objects;
DROP POLICY IF EXISTS org_media_auth_update        ON storage.objects;
DROP POLICY IF EXISTS org_media_auth_delete        ON storage.objects;
DROP POLICY IF EXISTS customer_avatars_auth_insert ON storage.objects;
DROP POLICY IF EXISTS customer_avatars_auth_update ON storage.objects;
