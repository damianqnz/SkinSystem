'use client';

/**
 * StatsCard — glassmorphism metric card with 0.98x scale hover.
 * Client Component (requires framer-motion).
 */

import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';
import type { ReactNode } from 'react';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  trend?: string;
}

export function StatsCard({ label, value, icon, trend }: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'relative overflow-hidden rounded-sm p-6 cursor-default select-none',
        'bg-white/60 backdrop-blur-md',
        'border border-[var(--color-spa-border)]',
        'shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]',
        'group',
      )}
    >
      {/* Inner glass highlight */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-[var(--color-spa-muted)] mb-3">
            {label}
          </p>
          <p className="font-sans text-[2.75rem] leading-none font-extralight tabular-nums text-[var(--color-spa-stone)]">
            {value}
          </p>
          {trend && (
            <p className="font-sans text-xs text-[var(--color-spa-muted)] mt-2">{trend}</p>
          )}
        </div>
        <div className="mt-0.5 flex-shrink-0 text-[var(--color-spa-muted)] group-hover:text-[#D4AF37] transition-colors duration-300">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
