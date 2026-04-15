# DESIGN_SYSTEM.md: Minimalist Luxury (New Internet Aesthetic)

This document defines the visual soul and user experience of SkinSystem. Every component must evoke exclusivity, health, and premium care.

---

## 1. Visual Tokens & Color Theory (60-30-10 Rule)
To ensure brand consistency across tenants (Lourdes/Gloria), we follow the 60-30-10 distribution:

- **60% Primary (Background/Base)**: `--bg-spa` (#FAFAF9) - A soft, high-end bone white.
- **30% Secondary (Text/Layout)**: `--text-main` (#1C1917) - Deep charcoal, almost black, for readability.
- **10% Accent (Action/Status)**: `--accent-spa` (#D4AF37) - Gold or brand-specific color for critical CTAs and active states.

## 2. Typography (Self-hosted via Fontsource)
- **Headings (H1, H2, H3)**: `Cormorant Garamond` (Elegant Serif). Used for titles to convey clinical authority and luxury.
- **Body & UI**: `Outfit` (Modern Sans-serif). Clean, high legibility for technical and medical data.

## 3. Visual Language & Shapes
- **Borders**: `rounded-none` or `rounded-sm`. Sharp or slightly softened corners to mimic high-end editorial layouts (Vogue/Architecture Digest style).
- **Icons**: `Lucide React` (Minimalist set). Thin strokes (1.5px weight).
- **Depth**: Subtle "Glassmorphism" for cards and modals using `backdrop-blur`.

---

## 4. Adaptive UX & Ergonomics (Mobile-First)

### 4.1 Thumb-Driven Design (The Thumb Zone)
- **Law**: All critical actions (Confirm Appointment, Save Record, Language Switch) must be located in the lower 30% of the screen.
- **Navigation**: Persistent **Bottom Bar** for mobile/iPad; Sidebar for desktop.



### 4.2 Modern Layouts
- **Container Queries**: Components must adapt to their container context, not just the global viewport.
- **Aspect Ratio**: Mandatory use of `aspect-ratio` for "Before & After" photos to prevent Layout Shift (CLS).

### 4.3 Tactile & Visual Feedback
- **Micro-interactions**: Use **GSAP** or **Framer Motion** for 0.98x scale-down on press.
- **Haptic Simulation**: Visual pulses or suttle color shifts when interacting with medical data.

---

## 5. Critical UI Components

### 5.1 PDF & Routine Generator
- **Location**: Thumb-Zone (Bottom of screen).
- **Interface**: Large segmented buttons (min 44x44px) for Language Selection (ES | PT | EN).
- **Aesthetic**: Minimalist preview of the document before generation.

### 5.2 The "Wait" Experience
- **Skeletons**: Use custom-themed Shimmer effects that match the brand accent color.
- **MagicUI**: Use `RetroGrid` or `Beam` effects for background depth in Auth pages.