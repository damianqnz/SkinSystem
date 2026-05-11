---
name: i18n Standard — next-intl/messages pattern
description: The project adopted next-intl@4.9.1 + messages/*.json as the universal i18n standard, piloted in /dashboard/billing (Phase 34, 2026-05-08).
type: project
---

The project now uses `next-intl@4.9.1` with global `src/messages/{pt,es,en}.json` files as the i18n standard.

**Infrastructure (established in Phase 34):**
- `src/i18n/request.ts` — `getRequestConfig` reads locale from `x-locale` header; fallback `pt`.
- `src/global.d.ts` — `IntlMessages = typeof en` augmentation; `en.json` is source-of-truth for types.
- `next.config.js` — wrapped with `createNextIntlPlugin('./src/i18n/request.ts')`.
- `(dashboard)/layout.tsx` — `NextIntlClientProvider locale messages` wraps `TenantProvider`.

**Pattern for server components:** `getTranslations({ locale, namespace: 'dashboard.xxx' })` — locale from `x-locale` header.

**Pattern for client components:** `useTranslations('dashboard.xxx.yyy')` — locale from `useLocale()`.

**Namespace structure:** `dashboard.<module>.<subnamespace>.<key>` — e.g. `dashboard.billing.history.generateBtn`.

**Why:** Replaces per-module `_i18n.ts` local maps (legacy pattern). All modules should migrate to this pattern.

**How to apply:** When creating or modifying any dashboard UI, use `useTranslations`/`getTranslations` with `messages/*.json` keys. Do NOT create new `_i18n.ts` local files. Check existing namespace before adding new keys to avoid duplication.
