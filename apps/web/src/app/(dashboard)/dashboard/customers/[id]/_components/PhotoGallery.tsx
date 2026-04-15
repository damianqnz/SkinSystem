'use client';

/**
 * PhotoGallery — clinical before/after grid.
 * Each session pair has a comparison slider (clip-path technique).
 * Images use aspect-ratio: 3/4 to prevent CLS (STANDARDS §9).
 * Photos are served via Supabase Signed URLs (60min, generated server-side).
 */

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────

export type SignedPhoto = {
  id: string;
  photoType: string;
  signedUrl: string | null;
  takenAt: string; // ISO
};

export type PhotoSession = {
  sessionId: string;
  sessionDate: string; // ISO
  serviceName: string;
  photos: SignedPhoto[];
};

// ── Before/After Slider ───────────────────────────────────────

function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos]     = useState(50);
  const containerRef      = useRef<HTMLDivElement>(null);
  const dragging          = useRef(false);

  const move = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const { left, width } = containerRef.current.getBoundingClientRect();
    setPos(Math.min(100, Math.max(0, ((clientX - left) / width) * 100)));
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-sm cursor-col-resize select-none"
      style={{ aspectRatio: '3/4' }}
      onMouseDown={() => { dragging.current = true; }}
      onMouseUp={() => { dragging.current = false; }}
      onMouseLeave={() => { dragging.current = false; }}
      onMouseMove={(e) => { if (dragging.current) move(e.clientX); }}
      onTouchMove={(e) => move(e.touches[0]!.clientX)}
    >
      {/* Before */}
      <Image src={before} alt="Antes" fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />

      {/* After — clipped to slider position */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={after} alt="Después" fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />
      </div>

      {/* Divider handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-[0_0_6px_rgba(0,0,0,0.4)] pointer-events-none"
        style={{ left: `${pos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-[calc(50%-1px)] w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path d="M4 5H0.5M4 5L2 2.5M4 5L2 7.5M10 5H13.5M10 5L12 2.5M10 5L12 7.5" stroke="#1C1917" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute top-2 left-2 font-sans text-[9px] uppercase tracking-widest text-white/90 bg-black/35 px-2 py-0.5 rounded-sm pointer-events-none">
        Antes
      </span>
      <span className="absolute top-2 right-2 font-sans text-[9px] uppercase tracking-widest text-white/90 bg-black/35 px-2 py-0.5 rounded-sm pointer-events-none">
        Después
      </span>
    </div>
  );
}

// ── Single photo tile ─────────────────────────────────────────

function PhotoTile({ photo }: { photo: SignedPhoto }) {
  if (!photo.signedUrl) {
    return (
      <div className="w-full bg-stone-100 rounded-sm flex items-center justify-center text-[var(--color-spa-muted)]" style={{ aspectRatio: '3/4' }}>
        <ImageOff size={20} strokeWidth={1.5} />
      </div>
    );
  }
  return (
    <div className="relative w-full rounded-sm overflow-hidden" style={{ aspectRatio: '3/4' }}>
      <Image src={photo.signedUrl} alt={photo.photoType} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover" />
      <span className="absolute bottom-2 left-2 font-sans text-[9px] uppercase tracking-widest text-white/80 bg-black/30 px-1.5 py-0.5 rounded-sm">
        {photo.photoType}
      </span>
    </div>
  );
}

// ── Session block ─────────────────────────────────────────────

function SessionBlock({ session, locale }: { session: PhotoSession; locale: string }) {
  const tag      = locale === 'pt' ? 'pt-PT' : locale === 'en' ? 'en-GB' : 'es-ES';
  const dateStr  = new Date(session.sessionDate).toLocaleDateString(tag, { day: 'numeric', month: 'long', year: 'numeric' });
  const before   = session.photos.find(p => p.photoType === 'before')?.signedUrl;
  const after    = session.photos.find(p => p.photoType === 'after')?.signedUrl;
  const rest     = session.photos.filter(p => p.photoType !== 'before' && p.photoType !== 'after');

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h4 className="font-serif text-base font-light text-[var(--color-spa-stone)]">{session.serviceName}</h4>
        <span className="font-sans text-xs text-[var(--color-spa-muted)]">{dateStr}</span>
      </div>

      {before && after ? (
        <BeforeAfterSlider before={before} after={after} />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {session.photos.map(p => <PhotoTile key={p.id} photo={p} />)}
        </div>
      )}

      {rest.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {rest.map(p => <PhotoTile key={p.id} photo={p} />)}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────

interface Props { sessions: PhotoSession[]; locale: string }

export function PhotoGallery({ sessions, locale }: Props) {
  const hasSessions = sessions.some(s => s.photos.length > 0);

  if (!hasSessions) {
    return (
      <div className="flex items-center gap-3 py-8 text-[var(--color-spa-muted)]">
        <ImageOff size={18} strokeWidth={1.5} />
        <p className="font-sans text-sm">Sin fotografías clínicas registradas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sessions
        .filter(s => s.photos.length > 0)
        .map(s => <SessionBlock key={s.sessionId} session={s} locale={locale} />)
      }
    </div>
  );
}
