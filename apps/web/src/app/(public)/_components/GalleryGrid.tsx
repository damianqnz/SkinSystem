'use client';

import Image             from 'next/image';
import { GALLERY_EVENT } from './GalleryModal';
import type { GalleryImage } from '../_data/getLandingData';

interface Props {
  images: GalleryImage[];
}

export function GalleryGrid({ images }: Props) {
  if (images.length === 0) return null;

  const openAt = (startIndex: number) => {
    window.dispatchEvent(
      new CustomEvent(GALLERY_EVENT, { detail: { startIndex } }),
    );
  };

  return (
    <section id="galeria" className="py-14 border-t border-stone-100 dark:border-stone-800">
      <div className="mb-8">
        <p className="text-[11px] font-outfit font-medium text-stone-400 uppercase tracking-[0.2em] mb-2">
          Portfólio
        </p>
        <h2 className="font-cormorant text-4xl font-semibold text-stone-900 dark:text-stone-100">
          Galeria
        </h2>
        <div className="mt-3 w-10 h-px bg-amber-400/60" />
      </div>

      {/* Masonry-style grid */}
      <div className="columns-2 sm:columns-3 gap-3 space-y-3">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => openAt(i)}
            className="block w-full break-inside-avoid overflow-hidden rounded-xl group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <div className="relative w-full aspect-square overflow-hidden">
              <Image
                src={img.url}
                alt={img.altText ?? ''}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
