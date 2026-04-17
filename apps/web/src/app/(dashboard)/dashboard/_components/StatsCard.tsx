'use client';

import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import type { ReactNode } from 'react';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  trend?: string;
}

/**
 * Editorial bento metric card.
 *  - Title  → Cormorant Garamond
 *  - Number → Outfit, text-4xl extralight, tabular nums
 *  - Border → 1px hairline, no shadow
 *  - Hover  → subtle scale + gold icon tint
 */
export function StatsCard({ label, value, icon, trend }: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'group relative rounded-md p-6 cursor-default select-none',
        'bg-white border border-spa-border',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title — Cormorant Garamond */}
          <p
            className="text-[15px] leading-tight text-(--color-spa-stone) font-light tracking-wide"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {label}
          </p>

          {/* Number — Outfit text-4xl */}
          <p
            className="text-4xl leading-none font-extralight tabular-nums text-(--color-spa-stone)"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {value}
          </p>

          {trend && (
            <p
              className="text-[11px] uppercase tracking-[0.14em] text-spa-muted"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {trend}
            </p>
          )}
        </div>

        {/* Icon — gold tint on hover */}
        <div className="mt-1 shrink-0 text-spa-muted group-hover:text-[#D4AF37] transition-colors duration-300">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
