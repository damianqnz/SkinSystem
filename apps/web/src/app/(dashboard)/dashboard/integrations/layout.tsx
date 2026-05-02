import type { ReactNode } from 'react';

/**
 * /dashboard/integrations layout
 *
 * Parallel route: the `@modal` slot is rendered ON TOP of the integrations
 * list whenever an intercepting route matches (e.g. `(.)stripe/page.tsx`).
 * On hard reloads / deep links the slot collapses to `default.tsx → null`,
 * and the request falls through to the regular `stripe/page.tsx` segment
 * inside `children` (full-page fallback). This gives us the Setmore-style
 * "modal-on-list" feel without losing shareable URLs.
 */
export default function IntegrationsLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal:    ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
