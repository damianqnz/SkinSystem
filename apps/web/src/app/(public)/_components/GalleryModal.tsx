'use client';

import { useEffect, useState, useCallback } from 'react';
import Image                                 from 'next/image';
import { X, ChevronLeft, ChevronRight }      from 'lucide-react';
import type { GalleryImage }                 from '../_data/getLandingData';

// Dispatched by HeroSection button and GalleryGrid thumbnails
export const GALLERY_EVENT = 'skinsystem:open-gallery';

interface GalleryModalProps {
  images: GalleryImage[];
}

export function GalleryModal({ images }: GalleryModalProps) {
  const [open,  setOpen]  = useState(false);
  const [index, setIndex] = useState(0);

  const close = useCallback(() => setOpen(false), []);

  const prev = useCallback(() =>
    setIndex(i => (i - 1 + images.length) % images.length), [images.length]);

  const next = useCallback(() =>
    setIndex(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ startIndex?: number }>).detail;
      setIndex(detail?.startIndex ?? 0);
      setOpen(true);
    };
    window.addEventListener(GALLERY_EVENT, handler);
    return () => window.removeEventListener(GALLERY_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     close();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, close, prev, next]);

  if (!open || images.length === 0) return null;

  const current = images[index];
  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      onClick={close}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" onClick={e => e.stopPropagation()}>
        <span className="text-stone-400 font-outfit text-sm">
          {index + 1} / {images.length}
        </span>
        <button
          onClick={close}
          className="p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          aria-label="Fechar galeria"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main image */}
      <div
        className="flex-1 flex items-center justify-center relative px-12"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={prev}
          className="absolute left-2 p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft size={28} />
        </button>

        <div className="relative w-full max-w-3xl aspect-[4/3]">
          <Image
            key={current.id}
            src={current.url}
            alt={current.altText ?? ''}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>

        <button
          onClick={next}
          className="absolute right-2 p-2 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          aria-label="Próxima"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div
        className="flex gap-2 overflow-x-auto px-6 py-4 no-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setIndex(i)}
            className={[
              'shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-colors',
              i === index ? 'border-amber-400' : 'border-transparent opacity-50 hover:opacity-80',
            ].join(' ')}
          >
            <Image
              src={img.url} alt={img.altText ?? ''}
              width={56} height={56}
              className="object-cover w-full h-full"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
