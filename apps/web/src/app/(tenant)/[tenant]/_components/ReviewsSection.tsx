'use client';

import { useState } from 'react';
import { Star }     from 'lucide-react';
import type { Review } from '../_data/getLandingData';

// ── Helpers ───────────────────────────────────────────────────

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i} size={size}
          className={i <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300 dark:text-stone-600'}
        />
      ))}
    </div>
  );
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const days  = Math.floor(diff / 86_400_000);
  if (days === 0)  return 'Hoje';
  if (days === 1)  return 'Ontem';
  if (days < 7)   return `Há ${days} dias`;
  if (days < 30)  return `Há ${Math.floor(days / 7)} semanas`;
  if (days < 365) return `Há ${Math.floor(days / 30)} meses`;
  return `Há ${Math.floor(days / 365)} anos`;
}

// ── Component ─────────────────────────────────────────────────

interface Props {
  reviews:     Review[];
  avgRating:   number;
  reviewCount: number;
}

const INITIAL_VISIBLE = 5;

export function ReviewsSection({ reviews, avgRating, reviewCount }: Props) {
  const [showAll, setShowAll] = useState(false);

  if (reviews.length === 0) return null;

  const visible     = showAll ? reviews : reviews.slice(0, INITIAL_VISIBLE);
  const starCounts  = [5, 4, 3, 2, 1].map(n => ({
    stars: n,
    count: reviews.filter(r => r.rating === n).length,
  }));

  return (
    <section id="avaliacoes" className="py-14 border-t border-stone-100 dark:border-stone-800">
      <div className="mb-8">
        <p className="text-[11px] font-outfit font-medium text-stone-400 uppercase tracking-[0.2em] mb-2">
          Opinião dos clientes
        </p>
        <h2 className="font-cormorant text-4xl font-semibold text-stone-900 dark:text-stone-100">
          Avaliações
        </h2>
        <div className="mt-3 w-10 h-px bg-amber-400/60" />
      </div>

      {/* Rating summary */}
      <div className="flex items-start gap-8 mb-10">
        {/* Big badge */}
        <div className="shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-400/10">
          <span className="font-cormorant text-4xl font-semibold text-stone-900 dark:text-stone-100 leading-none">
            {avgRating}
          </span>
          <Stars rating={avgRating} size={12} />
          <span className="text-[11px] text-stone-400 mt-0.5 font-outfit">{reviewCount} avaliações</span>
        </div>

        {/* Bar chart */}
        <div className="flex-1 space-y-2 pt-1">
          {starCounts.map(({ stars, count }) => {
            const pct = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3">
                <span className="text-[12px] text-stone-500 dark:text-stone-400 w-4 text-right font-outfit">{stars}</span>
                <Star size={11} className="fill-amber-400 text-amber-400 shrink-0" />
                <div className="flex-1 h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[12px] text-stone-400 w-5 font-outfit">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-5">
        {visible.map(review => (
          <div
            key={review.id}
            className="pb-5 border-b border-stone-100 dark:border-stone-800 last:border-0"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="shrink-0 w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-[13px] font-outfit font-semibold text-stone-500 dark:text-stone-400">
                {review.reviewerName?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-outfit font-medium text-[14px] text-stone-900 dark:text-stone-100">
                    {review.reviewerName ?? 'Anónimo'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-stone-400 font-outfit">
                      {timeAgo(review.publishedAt)}
                    </span>
                    <span className="text-[10px] text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full font-outfit">
                      Google
                    </span>
                  </div>
                </div>
                <Stars rating={review.rating} size={12} />
                {review.comment && (
                  <p className="mt-2 text-[13px] text-stone-600 dark:text-stone-400 leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show more */}
      {reviews.length > INITIAL_VISIBLE && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="mt-6 text-[13px] font-outfit font-medium text-stone-500 dark:text-stone-400 underline underline-offset-2 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
        >
          {showAll ? 'Mostrar menos' : `Mostrar todos os comentários (${reviews.length})`}
        </button>
      )}
    </section>
  );
}
