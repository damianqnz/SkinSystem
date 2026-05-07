// ── Brand logos for each integration ─────────────────────────
// Self-contained SVG/HTML components — no external images needed.

import type { IntegrationId } from './integrations-data';

interface LogoProps { size?: 'sm' | 'md' | 'lg' }

const SZ = { sm: 'w-10 h-10', md: 'w-12 h-12', lg: 'w-14 h-14' };
const ICON_SZ = { sm: 'w-5 h-5', md: 'w-6 h-6', lg: 'w-7 h-7' };

function FacebookLogo({ size = 'md' }: LogoProps) {
  return (
    <div className={`${SZ[size]} rounded-xl bg-[#1877F2] flex items-center justify-center flex-shrink-0`}>
      <svg viewBox="0 0 24 24" fill="white" className={ICON_SZ[size]}>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    </div>
  );
}

function InstagramLogo({ size = 'md' }: LogoProps) {
  return (
    <div className={`${SZ[size]} rounded-xl flex items-center justify-center flex-shrink-0`}
      style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
      <svg viewBox="0 0 24 24" fill="white" className={ICON_SZ[size]}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    </div>
  );
}

function GoogleAnalyticsLogo({ size = 'md' }: LogoProps) {
  return (
    <div className={`${SZ[size]} rounded-xl bg-white border border-stone-100 flex items-center justify-center flex-shrink-0`}>
      <svg viewBox="0 0 24 24" className={ICON_SZ[size]}>
        <path d="M22.84 2.998C22.84 1.341 21.497 0 19.84 0s-3 1.341-3 2.998v18.004C16.84 22.659 18.183 24 19.84 24s3-1.341 3-3.002V2.998h-.001zM13.5 8.547c0-1.657-1.343-2.998-3-2.998s-3 1.341-3 2.998v12.455C7.5 22.659 8.843 24 10.5 24s3-1.341 3-3.002V8.547zM4.16 14.547c0-1.657-1.343-2.998-3-2.998S.16 12.89.16 14.547v6.455C.16 22.659 1.503 24 3.16 24s3-1.341 3-3.002v-6.451z" fill="#F9AB00" />
      </svg>
    </div>
  );
}

function GTMLogo({ size = 'md' }: LogoProps) {
  return (
    <div className={`${SZ[size]} rounded-xl bg-[#4285F4] flex items-center justify-center flex-shrink-0`}>
      <svg viewBox="0 0 24 24" fill="white" className={ICON_SZ[size]}>
        <path d="M12 0L1.605 6v12L12 24l10.395-6V6L12 0zm0 2.19l8.355 4.822v9.976L12 21.81l-8.355-4.822V7.012L12 2.19zM8.963 15.847l-2.653-4.6L8.963 6.6l2.654 4.647-2.654 4.6zm2.654 4.6l-2.654-4.6 2.654-4.647 2.654 4.647-2.654 4.6z" />
      </svg>
    </div>
  );
}

function StripeLogo({ size = 'md' }: LogoProps) {
  return (
    <div className={`${SZ[size]} rounded-xl flex items-center justify-center shrink-0`}>
      <svg viewBox="0 0 15 15" fill="#635BFF" className="w-7" aria-label="Stripe">
        <path fillRule="evenodd" clipRule="evenodd" d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm6.226 5.385c-.584 0-.937.164-.937.593 0 .468.607.674 1.36.93 1.228.415 2.844.963 2.851 2.993C11.5 11.868 9.924 13 7.63 13a7.7 7.7 0 0 1-3.009-.626V9.758c.926.506 2.095.88 3.01.88.617 0 1.058-.165 1.058-.671 0-.518-.658-.755-1.453-1.041C6.026 8.49 4.5 7.94 4.5 6.11 4.5 4.165 5.988 3 8.226 3a7.3 7.3 0 0 1 2.734.505v2.583c-.838-.45-1.896-.703-2.734-.703" />
      </svg>
    </div>
  );
}

function GoogleMapsLogo({ size = 'md' }: LogoProps) {
  return (
    <div className={`${SZ[size]} rounded-xl bg-white border border-stone-100 flex items-center justify-center flex-shrink-0`}>
      <svg viewBox="0 0 24 24" className={ICON_SZ[size]}>
        <path d="M12 0C7.802 0 4 3.403 4 7.602 4 11.8 7.469 16.812 12 24c4.531-7.188 8-12.2 8-16.398C20 3.403 16.199 0 12 0zm0 11a3 3 0 110-6 3 3 0 010 6z" fill="#EA4335" />
      </svg>
    </div>
  );
}

export function IntegrationLogo({ id, size = 'md' }: { id: IntegrationId; size?: 'sm' | 'md' | 'lg' }) {
  switch (id) {
    case 'facebook': return <FacebookLogo size={size} />;
    case 'instagram': return <InstagramLogo size={size} />;
    case 'google-analytics': return <GoogleAnalyticsLogo size={size} />;
    case 'google-tag-manager': return <GTMLogo size={size} />;
    case 'stripe': return <StripeLogo size={size} />;
    case 'google-maps': return <GoogleMapsLogo size={size} />;
  }
}
