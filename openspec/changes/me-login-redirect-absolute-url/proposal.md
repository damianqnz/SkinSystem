# Proposal: me-login-redirect-absolute-url

## Intent

Fix the relative `next=/me` redirect in `me/layout.tsx`'s defense-in-depth auth check so it produces a URL `resolveRedirectUrl()` actually accepts, instead of one that's silently discarded.

## Approach

Generalize `buildLoginUrl()` to take a raw host string instead of a full `NextRequest`, since that was the only thing it read from the request object. This lets `me/layout.tsx` (a Server Component with `headers()`, not a `NextRequest`) reuse the exact same, already-correct URL-construction logic instead of hand-rolling a second implementation. Update the one existing call site (`proxy.ts`) to pass `request.headers.get('host')` directly — behavior is unchanged, only the parameter shape.

## Non-goals

- Preserving the exact requested subpath (e.g. `/me/perfil`) in this fallback's `next` value — not possible without new header plumbing this layout doesn't have, and unnecessary since MW-03's primary proxy guard already does this correctly. This fallback only needed to stop being silently invalid.
- Any change to `proxy.ts`'s observable behavior — the refactor is a pure signature change at its one call site.

## Risk / size

Trivial. 3 files (`build-login-url.ts`, its new test, `proxy.ts`'s one-line call-site update, `me/layout.tsx`), no behavior change to the primary (proxy) auth path, only to a redundant fallback that's unreachable in the common case today.
