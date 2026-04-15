'use client';

/**
 * MagicCard — radial gradient that follows the mouse cursor.
 * Inspired by magicui.design. Requires framer-motion.
 */

import { useRef, useState } from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

interface MagicCardProps {
  children: React.ReactNode;
  className?: string;
  /** Radius of the radial gradient spotlight in px */
  gradientSize?: number;
  /** CSS colour of the spotlight */
  gradientColor?: string;
}

export function MagicCard({
  children,
  className,
  gradientSize = 300,
  gradientColor = 'rgba(212, 212, 216, 0.12)',
}: MagicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX  = useMotionValue(-gradientSize);
  const mouseY  = useMotionValue(-gradientSize);
  const [hovered, setHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const { left, top } = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  }

  const background = useMotionTemplate`
    radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 80%)
  `;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        mouseX.set(-gradientSize);
        mouseY.set(-gradientSize);
      }}
      className={cn('group relative', className)}
    >
      {/* Spotlight overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{ background, opacity: hovered ? 1 : 0 }}
      />
      {children}
    </div>
  );
}
