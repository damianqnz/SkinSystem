'use client';

import { Images }            from 'lucide-react';
import { GALLERY_EVENT }     from './GalleryModal';
import type { PublicOrg, GalleryImage } from '../_data/getLandingData';

// ── Helpers ───────────────────────────────────────────────────

function isVideo(url: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

// ── Component ─────────────────────────────────────────────────

interface Props {
  org:     PublicOrg;
  gallery: GalleryImage[];
}

export function HeroSection({ org, gallery }: Props) {
  const bannerUrl    = org.bannerUrl;
  const hasVideo     = isVideo(bannerUrl);
  const hasGallery   = gallery.length > 0;

  const openGallery = () => {
    window.dispatchEvent(
      new CustomEvent(GALLERY_EVENT, { detail: { startIndex: 0 } }),
    );
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

      {/* ── Background media ──────────────────────────────── */}
      {hasVideo ? (
        <video
          src={bannerUrl!}
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden
        />
      ) : bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bannerUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden
        />
      ) : null}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: bannerUrl
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.75) 100%)'
            : 'linear-gradient(135deg, #0c0a09 0%, #1c1917 100%)',
        }}
        aria-hidden
      />

      {/* Dot-grid pattern (shown when no media) */}
      {!bannerUrl && (
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
            backgroundSize:  '28px 28px',
          }}
          aria-hidden
        />
      )}

      {/* Gold accent lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" aria-hidden />

      {/* ── Content ────────────────────────────────────────── */}
      <div className="relative z-10 text-center px-6 max-w-2xl">
        <p className="text-[11px] font-outfit font-medium text-amber-400/80 uppercase tracking-[0.35em] mb-6">
          Estética Avançada
        </p>

        <h1 className="font-cormorant text-6xl sm:text-8xl md:text-9xl font-light text-white leading-none tracking-tight">
          {org.name}
        </h1>

        {/* Divider */}
        <div className="my-8 flex items-center justify-center gap-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400/60" />
          <div className="w-1 h-1 rounded-full bg-amber-400" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400/60" />
        </div>

        <p className="font-outfit text-base text-white/60 leading-relaxed max-w-sm mx-auto">
          Onde a ciência e a arte se unem<br />
          para realçar a tua beleza natural
        </p>
      </div>

      {/* ── Gallery button (bottom-right) ─────────────────── */}
      {hasGallery && (
        <button
          onClick={openGallery}
          className="absolute bottom-6 right-6 z-10 flex items-center gap-2 px-4 py-2.5 bg-black/50 backdrop-blur-sm border border-white/20 rounded-xl text-white text-[13px] font-outfit hover:bg-black/70 transition-colors"
        >
          <Images size={15} className="text-amber-400" />
          Mostrar todas as fotos
        </button>
      )}

      {/* Scroll hint */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 pointer-events-none">
        <div className="w-px h-10 bg-gradient-to-b from-transparent to-stone-300" aria-hidden />
        <p className="text-[10px] text-stone-400 uppercase tracking-[0.2em] font-outfit">Descobrir</p>
      </div>
    </section>
  );
}
