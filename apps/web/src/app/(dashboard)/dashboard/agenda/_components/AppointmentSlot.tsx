'use client';

/**
 * AppointmentSlot — Stitches atomic component.
 * Variants drive the full visual state of each calendar slot.
 * Stitches is used here (not Tailwind) because status + size need atomic
 * compound variants that would otherwise require complex Tailwind conditionals.
 */

import { createStitches } from '@stitches/react';
import type { CalendarEvent } from '@/domains/booking/calendar-service';

const { styled } = createStitches({
  theme: {
    colors: {
      gold:         '#D4AF37',
      goldMuted:    '#F5ECBB',
      stone:        '#1C1917',
      muted:        '#78716C',
      cream:        '#FAFAF9',
      border:       '#E7E5E4',
      green:        '#10B981',
      greenMuted:   '#D1FAE5',
      amber:        '#F59E0B',
      amberMuted:   '#FEF3C7',
      red:          '#EF4444',
      redMuted:     '#FEE2E2',
      sky:          '#0EA5E9',
      skyMuted:     '#E0F2FE',
      slate:        '#64748B',
      slateMuted:   '#F1F5F9',
    },
    fontSizes: {
      xs: '10px',
      sm: '11px',
      md: '12px',
    },
    radii: {
      sm: '4px',
      md: '6px',
    },
  },
});

export const SlotCard = styled('div', {
  position:      'absolute',
  left:          '4px',
  right:         '4px',
  borderRadius:  '$md',
  padding:       '4px 6px',
  overflow:      'hidden',
  cursor:        'pointer',
  userSelect:    'none',
  transition:    'opacity 150ms, transform 150ms',
  borderLeft:    '3px solid transparent',

  '&:hover': {
    opacity: 0.92,
    transform: 'scale(1.01)',
  },
  '&:active': {
    transform: 'scale(0.99)',
  },

  variants: {
    status: {
      pending: {
        backgroundColor: '$amberMuted',
        borderLeftColor: '$amber',
        color:           '$stone',
      },
      confirmed: {
        backgroundColor: '$skyMuted',
        borderLeftColor: '$sky',
        color:           '$stone',
      },
      in_progress: {
        backgroundColor: '$goldMuted',
        borderLeftColor: '$gold',
        color:           '$stone',
      },
      completed: {
        backgroundColor: '$greenMuted',
        borderLeftColor: '$green',
        color:           '$stone',
      },
      cancelled: {
        backgroundColor: '$slateMuted',
        borderLeftColor: '$slate',
        color:           '$muted',
        opacity:         0.6,
      },
      no_show: {
        backgroundColor: '$redMuted',
        borderLeftColor: '$red',
        color:           '$muted',
        opacity:         0.6,
      },
    },
  },

  defaultVariants: {
    status: 'pending',
  },
});

export const BufferBlock = styled('div', {
  position:      'absolute',
  left:          '4px',
  right:         '4px',
  backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(100,116,139,0.08) 3px, rgba(100,116,139,0.08) 6px)',
  borderRadius:  '$sm',
  pointerEvents: 'none',
  zIndex:        0,
});

export const SlotTitle = styled('p', {
  fontSize:    '$md',
  fontWeight:  600,
  lineHeight:  '1.3',
  whiteSpace:  'nowrap',
  overflow:    'hidden',
  textOverflow:'ellipsis',
  margin:      0,
});

export const SlotSubtitle = styled('p', {
  fontSize:   '$xs',
  lineHeight: '1.4',
  opacity:    0.7,
  margin:     0,
  whiteSpace: 'nowrap',
  overflow:   'hidden',
  textOverflow: 'ellipsis',
});

// ── Typed status helper ───────────────────────────────────────

type SlotStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

function toSlotStatus(s: string): SlotStatus {
  const valid: SlotStatus[] = ['pending','confirmed','in_progress','completed','cancelled','no_show'];
  return valid.includes(s as SlotStatus) ? (s as SlotStatus) : 'pending';
}

// ── px-per-minute constant (shared with WeekGrid) ─────────────
export const PX_PER_MIN = 2;   // 60min = 120px row
export const GRID_START_HOUR = 8;  // 08:00

// ── EventCard ─────────────────────────────────────────────────

interface EventCardProps {
  event:        CalendarEvent;
  locale:       string;
  columnIndex:  number;
  totalColumns: number;
  onClick?:     (event: CalendarEvent) => void;
}

/** Renders a positioned appointment card inside the WeekGrid column. */
export function EventCard({ event, locale, columnIndex, totalColumns, onClick }: EventCardProps) {
  const start   = new Date(event.startAt);
  const topMin  = start.getUTCHours() * 60 + start.getUTCMinutes() - GRID_START_HOUR * 60;
  const top     = topMin * PX_PER_MIN;
  const height  = Math.max(event.durationMinutes * PX_PER_MIN, 22);

  const bufBefore = event.bufferBeforeMinutes * PX_PER_MIN;
  const bufAfter  = event.bufferAfterMinutes  * PX_PER_MIN;

  const serviceName =
    (event.serviceName?.[locale] as string | undefined) ??
    (event.serviceName?.['es'] as string | undefined) ??
    Object.values(event.serviceName ?? {})[0] ??
    '—';

  const timeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  // Multi-column overlap layout
  const colW    = `calc((100% - 8px) / ${totalColumns})`;
  const colLeft = `calc(4px + ${columnIndex} * (100% - 8px) / ${totalColumns})`;

  return (
    <>
      {/* Buffer before */}
      {bufBefore > 0 && (
        <BufferBlock style={{ top: top - bufBefore, height: bufBefore }} />
      )}

      {/* Appointment card */}
      <SlotCard
        status={toSlotStatus(event.status)}
        style={{ top, height, width: colW, left: colLeft, right: 'unset', zIndex: 1 }}
        onClick={() => onClick?.(event)}
        title={`${event.customerName} · ${serviceName}`}
      >
        <SlotTitle>{event.customerName}</SlotTitle>
        {height > 30 && <SlotSubtitle>{timeStr} · {serviceName}</SlotSubtitle>}
      </SlotCard>

      {/* Buffer after */}
      {bufAfter > 0 && (
        <BufferBlock style={{ top: top + height, height: bufAfter }} />
      )}
    </>
  );
}
