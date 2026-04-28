'use client';

/**
 * SlotCell — Stitches atomic component for individual calendar slots.
 *
 * Stitches is used here (not Tailwind) because status-driven compound variants
 * require atomic CSS-in-JS specificity that Tailwind class conditionals cannot
 * guarantee across hydration boundaries (CLAUDE.md §2 CSS Boundary Rule).
 *
 * Variants:
 *   available  → soft cream/white, gold left-border on hover
 *   booked     → sky blue, solid — appointment exists
 *   locked     → amber pulse animation — Redis 5-min lock active
 *   buffer     → diagonal stripe, reduced opacity — setup/cleanup zone
 *   blocked    → slate, strikethrough pattern — manual block
 *   break      → stone/muted, no interaction
 *   outside_hours → transparent, no interaction
 */

import { createStitches, keyframes } from '@stitches/react';
import type { ComputedSlot } from '@/domains/booking/service';

const pulse = keyframes({
  '0%, 100%': { opacity: 1 },
  '50%':      { opacity: 0.65 },
});

const { styled, css } = createStitches({
  theme: {
    colors: {
      gold:       '#D4AF37',
      goldLight:  '#F5ECBB',
      goldMid:    '#E8D48A',
      stone:      '#1C1917',
      muted:      '#78716C',
      border:     '#E7E5E4',
      cream:      '#FAFAF9',
      sky:        '#0EA5E9',
      skyLight:   '#E0F2FE',
      skySolid:   '#0284C7',
      amber:      '#F59E0B',
      amberLight: '#FEF3C7',
      emerald:    '#10B981',
      slate:      '#64748B',
      slateLight: '#F1F5F9',
      red:        '#EF4444',
    },
    space: {
      1: '4px',
      2: '6px',
      3: '8px',
    },
    fontSizes: {
      xs: '10px',
      sm: '11px',
    },
    radii: {
      sm: '3px',
      md: '5px',
    },
  },
});

export const SlotWrapper = styled('button', {
  display:        'flex',
  alignItems:     'center',
  width:          '100%',
  minHeight:      '28px',
  borderRadius:   '$md',
  padding:        '$1 $2',
  border:         'none',
  cursor:         'pointer',
  transition:     'all 140ms ease',
  outline:        'none',
  position:       'relative',
  overflow:       'hidden',
  textAlign:      'left',
  borderLeft:     '2.5px solid transparent',

  '&:focus-visible': {
    boxShadow: '0 0 0 2px $colors$gold',
  },

  variants: {
    status: {
      available: {
        backgroundColor: '$cream',
        borderLeftColor: 'transparent',
        color:           '$muted',

        '&:hover': {
          backgroundColor: '$goldLight',
          borderLeftColor: '$gold',
          color:           '$stone',
        },
        '&:active': {
          backgroundColor: '$goldMid',
        },
      },

      booked: {
        backgroundColor: '$skyLight',
        borderLeftColor: '$sky',
        color:           '$stone',
        cursor:          'default',

        '&:hover': {
          backgroundColor: '$skyLight',
          filter:          'brightness(0.97)',
        },
      },

      locked: {
        backgroundColor: '$amberLight',
        borderLeftColor: '$amber',
        color:           '$stone',
        cursor:          'not-allowed',
        animation:       `${pulse} 2s ease-in-out infinite`,
      },

      buffer: {
        backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(100,116,139,0.07) 4px, rgba(100,116,139,0.07) 8px)',
        backgroundColor: 'transparent',
        borderLeftColor: '$border',
        color:           '$muted',
        cursor:          'not-allowed',
        opacity:         0.8,
      },

      blocked: {
        backgroundColor: '$slateLight',
        borderLeftColor: '$slate',
        color:           '$muted',
        cursor:          'not-allowed',
        opacity:         0.7,
      },

      break: {
        backgroundColor: 'transparent',
        borderLeftColor: 'transparent',
        color:           '$muted',
        cursor:          'default',
        opacity:         0.5,
      },

      outside_hours: {
        backgroundColor: 'transparent',
        borderLeftColor: 'transparent',
        color:           'transparent',
        cursor:          'default',
        pointerEvents:   'none',
      },
    },
  },

  defaultVariants: {
    status: 'available',
  },
});

export const SlotTime = styled('span', {
  fontSize:    '$xs',
  fontVariantNumeric: 'tabular-nums',
  flexShrink:  0,
  marginRight: '6px',
  color:       'inherit',
  lineHeight:  1,
  minWidth:    '34px',
});

export const SlotLabel = styled('span', {
  fontSize:    '$sm',
  lineHeight:  1.3,
  overflow:    'hidden',
  textOverflow:'ellipsis',
  whiteSpace:  'nowrap',
  flex:        1,
  color:       'inherit',
});

export const LockBadge = styled('span', {
  fontSize:     '9px',
  fontWeight:   600,
  letterSpacing:'0.05em',
  backgroundColor: '$amber',
  color:        'white',
  padding:      '1px 5px',
  borderRadius: '999px',
  textTransform:'uppercase',
  flexShrink:   0,
});

// ── SlotCell ─────────────────────────────────────────────────

type SlotStatusType = ComputedSlot['status'];

interface SlotCellProps {
  slot:       ComputedSlot;
  timeLabel:  string;   // "09:30"
  label?:     string;   // customer name or status text
  onClick?:   (slot: ComputedSlot) => void;
}

const STATUS_LABEL: Partial<Record<SlotStatusType, string>> = {
  available:     'Disponible',
  buffer:        '— preparación —',
  blocked:       'Bloqueado',
  break:         'Descanso',
  outside_hours: '',
};

export function SlotCell({ slot, timeLabel, label, onClick }: SlotCellProps) {
  const displayLabel =
    label ??
    STATUS_LABEL[slot.status] ??
    slot.status;

  const isInteractive = slot.status === 'available' || slot.status === 'booked';

  return (
    <SlotWrapper
      status={slot.status as SlotStatusType}
      onClick={isInteractive ? () => onClick?.(slot) : undefined}
      aria-label={`${timeLabel} ${displayLabel}`}
      tabIndex={isInteractive ? 0 : -1}
    >
      <SlotTime>{timeLabel}</SlotTime>
      <SlotLabel>{displayLabel}</SlotLabel>
      {slot.status === 'locked' && <LockBadge>En proceso</LockBadge>}
    </SlotWrapper>
  );
}
