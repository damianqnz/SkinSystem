import localFont from 'next/font/local';

/**
 * Single source of truth for the self-hosted brand fonts.
 *
 * Self-hosted via `next/font/local` instead of the Google Fonts loader because
 * the Google variant breaks Turbopack dev/CI: upstream vercel/next.js#99114
 * returns extensionless `fonts.gstatic.com/l/font?kit=…&skey=…` URLs that
 * Turbopack splits on `&` ("queries have exactly one entry"). Local fonts
 * never fetch Google Fonts, so dev/CI/build are hermetic.
 *
 * Weights/styles/variable names match the previous Google Fonts calls so
 * rendering is unchanged.
 */

export const outfit = localFont({
  src: [
    { path: './files/outfit-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: './files/outfit-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './files/outfit-latin-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
});

export const cormorant = localFont({
  src: [
    { path: './files/cormorant-garamond-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './files/cormorant-garamond-latin-400-italic.woff2', weight: '400', style: 'italic' },
    { path: './files/cormorant-garamond-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './files/cormorant-garamond-latin-600-italic.woff2', weight: '600', style: 'italic' },
    { path: './files/cormorant-garamond-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: './files/cormorant-garamond-latin-700-italic.woff2', weight: '700', style: 'italic' },
  ],
  variable: '--font-serif',
  display: 'swap',
});
