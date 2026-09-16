# Exploration: perf-01-consumer-shell-bundle (TICKET PERF-01)

## Source debt

`shared/components/ConsumerShell.tsx:53,82` mounts `NextIntlClientProvider` with the **entire** message bundle (`await getMessages()`, no subsetting) for every request under `(tenant)`/`(account)`. Flagged by 4 independent reviewers during PR3/3 (2026-08-08). Same issue independently present in `(marketing)/layout.tsx:27`.

## Re-measured (PR3/3's numbers are 5 weeks stale — I18N-04/05/07 added new namespaces since)

```
pt   full: 35,234 B   —  dashboard: 26,584 B (75.4%)
es   full: 35,159 B   —  dashboard: 26,498 B (75.4%)
en   full: 32,885 B   —  dashboard: 24,660 B (75.0%)
```

## Re-audited client-side namespace usage (do not trust the August measurement — verified fresh via `rg` over every `'use client'` file)

`rg -l "'use client'"` over `(tenant)`, `(account)`, and every `shared/` component actually imported from those trees, then `rg "useTranslations\("` on each match:

- `booking`, `booking.auth`, `booking.summary`, `booking.confirm`, `booking.common` — all nested under top-level `booking` (booking funnel Client Components).
- `calendar` — **new since PR3/3's measurement**: `StickyInfoCard.tsx` (added by I18N-05) reads `useTranslations('calendar')` for month/day names in the open/closed status line.
- `tenant.userMenu`, `tenant.openStatus`, `tenant.header` — all nested under top-level `tenant` (added/expanded by A11Y-02, I18N-05, I18N-07).

No dynamic/template-literal `useTranslations(\`...\`)` calls, no `.raw()`/`.rich()` calls that might reach outside these namespaces (checked via `rg`). `shared/components/booking/{SlotActionModal,AppointmentDetailModal}.tsx` — both `'use client'` and both read `dashboard.*` namespaces, but confirmed **not imported anywhere** under `(tenant)`/`(account)` (dashboard-only components); excluded. `(account)`'s 5 Client Components (`AppointmentTabs`, `ProfileForm`, `MeSidebar`, `LogoutButton`, plus `ServicesAccordion`/`GalleryModal`/`HeroSection`/`ReviewsSection`/`GalleryGrid` under `(tenant)`) — confirmed **zero** `next-intl` import at all (no `useTranslations`, no `useLocale`); they receive already-translated strings as props from their Server Component parents.

**Client-needed subset**: top-level `booking` + `calendar` + `tenant`.

```
pt   subset: 4,951 B  (saved 30,283 B, 85.9%)
es   subset: 4,943 B  (saved 30,216 B, 85.9%)
en   subset: 4,763 B  (saved 28,122 B, 85.5%)
```

## `(marketing)` — same defect, but simpler

`(marketing)/page.tsx` is a pure Server Component (`getTranslations('marketing.landing')`, server-side only). Zero Client Components exist under `(marketing)` today (confirmed: only `layout.tsx` and `page.tsx` in the whole route group). The `NextIntlClientProvider` mounted in `(marketing)/layout.tsx` ships the entire bundle for **zero** client consumers — 100% waste, not 75%. Fixed with the same technique (empty client-namespace list today; trivially extendable when marketing gains its first Client Component).

## Runtime-regression risk (why this wasn't fixed in PR3/3)

Narrowing the bundle is type-legal (`use-intl@4.9.1`'s `messages?: DeepPartial<Messages> | null`) but **not** compile-time safe: if a future Client Component under these route groups calls `useTranslations()` for a namespace outside the passed subset, `tsc` stays green (the `IntlMessages` global type is inferred from the full `en.json`, independent of any runtime subsetting) and the failure only surfaces at runtime as blank/raw-key text. This is the exact risk the original debt note flagged and why it asked for both `ConsumerShell` and `(marketing)/layout.tsx` to be fixed "at the same time" with an accompanying safeguard, not a silent one-off narrowing.

**Mitigation added in this change**: a new regression test statically scans every `'use client'` file under `(tenant)`, `(account)`, and `(marketing)` for `useTranslations('<namespace>...')` calls and asserts every namespace found is in the allow-list actually passed to that route group's provider — turning the flagged runtime risk into a CI-caught test failure the next time someone adds a client namespace without updating the allow-list.

## Non-goals

- `(dashboard)/layout.tsx` — already receives the full bundle by design (its Client Components span nearly every `dashboard.*` namespace); untouched.
- No change to the actual translated content in any `messages/*.json` file.
