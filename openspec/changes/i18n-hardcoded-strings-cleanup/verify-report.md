# Verify report: i18n-hardcoded-strings-cleanup (TICKET I18N-04)

**Verdict: PASS** (post-correction — see amendment below)

## Requirement-by-requirement check

1. **`book/success/page.tsx`** — `generateMetadata()` added using `getTranslations({ locale, namespace: 'booking.success' })`; all 6 body strings resolve via `t(...)`. Pre-existing local `t()` helper (JSONB name resolver) renamed to `resolveServiceName` to avoid shadowing the new translator — verified its one call site was updated. `rg` for the 5 original ES literals returns zero hits. PASS.
2. **`me/citas/page.tsx`** — empty-state block (`emptyTitle`/`emptySubtitle`/`bookCta`) fully resolved via `getTranslations({ locale, namespace: 'account.me.citas' })`. `AppointmentTabs.tsx` confirmed untouched (`git diff --stat` empty). PASS.
3. **`export-customers.ts`** — `STATUS_LABELS` deleted entirely (confirmed via `rg`, zero hits). Status now resolves via `tStatus(c.status)` against the existing `customers.status.*` namespace (no new keys). `COLS` ternary replaced with `dashboard.customers.export.columns.*` (6 new keys). PASS.
4. **`NewAppointmentForm.tsx`** — all ~14 identified literals replaced, including the 3 disabled placeholder tabs. `ServiceSelect` subcomponent updated to accept and use a `t` prop (typed `ReturnType<typeof useTranslations>`) rather than duplicating a second `useTranslations` call. `rg` sweep for all original PT literals returns zero hits outside one non-user-facing code comment. PASS.
5. **`AppointmentDetailModal.tsx`** — **zero new JSON keys**, as designed. Wires `t = useTranslations('dashboard.calendar.eventDetail')` and `tAppt = useTranslations('dashboard.customers.appointments')`, matching `EventDetailSheet.tsx:61-62,120` exactly. Local `SC` map's text fields removed, replaced with a `STATUS_TONE` tone-only map (mirroring `EventDetailSheet.tsx`'s own naming). `rg` sweep confirms zero remaining hardcoded PT strings. PASS.

## Cross-cutting checks

- **Key parity**: `pnpm --filter web test -- messages.test.ts` → 5/5 tests passed (re-run after all code changes, not just after the JSON edits).
- **Type safety**: `pnpm check-types` (`next typegen && tsc --noEmit`) → exit 0.
- **Lint**: `eslint --max-warnings 0` scoped to the 5 changed `.tsx`/`.ts` files → exit 0, zero warnings.
- **Scope discipline**: `git status --porcelain -uall` shows exactly 8 tracked files changed (5 code + 3 locale JSON) plus the 5 new openspec planning docs. `AppointmentTabs.tsx` and `EventDetailSheet.tsx` — the two sibling files explicitly named as non-goals — show zero diff.
- **Size**: `git diff --stat` on the 8 tracked files: 223 insertions / 71 deletions = 294 changed lines, within the ~200-line estimate's ballpark and comfortably under the 400-line single-PR budget.
- **Reuse verified empirically, not assumed**: read `EventDetailSheet.tsx` directly to confirm the exact `useTranslations` namespace names and the `tAppt('status.' + status)` call pattern before replicating it in `AppointmentDetailModal.tsx`.

## Deviations from design

This claim was inaccurate at initial verify time: `export-customers.ts`'s status lookup shipped as a bare `tStatus(c.status)` call, omitting the `tStatus.has(...)` guard that both `design.md:46` and `tasks.md:20` explicitly prescribed. The gap was caught by Gentle AI's post-push review (finding R3-1, CRITICAL — an unguarded dynamic-key lookup on a customer-facing CSV export, with no test exercising an unknown-status row), not by this verify pass. Fixed in commit `036c668`, and the same `.has()` guard was additionally applied to `AppointmentDetailModal.tsx`'s status lookup (Gentle AI finding R3-3, SUGGESTION) for consistency, though that one was assessed as pre-existing risk rather than a regression this change introduced.

## Amendment (post-review)

The original verify pass (above) missed the `.has()` guard omission because it checked "does the shipped code match the design's *intent*" narratively rather than diffing the design doc's exact prescribed guard against the shipped line. Recorded here as a process note for future verify passes on this project: when a design doc names a specific defensive pattern (like `t.has()`), verify should confirm its literal presence in the diff, not just that the surrounding behavior looks equivalent.

## Non-goals honored

- `AppointmentTabs.tsx` untouched.
- No file splitting of `NewAppointmentForm.tsx`.
- No merge of `AppointmentDetailModal.tsx`/`EventDetailSheet.tsx`.
- No `I18N-05`/`PERF-01`/`A11Y-*` changes.

## Process note

This entire SDD cycle (explore → propose → spec → design → tasks → apply → verify) was executed by the orchestrator directly, not delegated to sub-agents, because the `gentle-ai sdd-preflight-hook` (installed by `gentle-ai sync` earlier in this session) refuses all `Agent`-tool SDD dispatches even with a correctly-formatted, marker-compliant preflight — confirmed to be a tooling defect (the hook binary itself returns exit 0/allow when manually replayed with an equivalent payload, but the live harness's real invocation is refused). User explicitly chose to proceed with inline execution for this change rather than pause SDD work.
