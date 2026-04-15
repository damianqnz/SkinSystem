# Design System: Minimalist Luxury

## Typography (Fontsource)
- **Headings:** `Cormorant Garamond` (Elegante, Serif).
- **Body:** `Outfit` (Moderno, Minimalista, Sans-serif).

## Visual Tokens
- **Background:** `--bg-spa` (#FAFAF9).
- **Primary:** `--text-main` (#1C1917).
- **Accent:** `--accent-spa` (#D4D4D8).
- **Borders:** `rounded-none` o `rounded-sm` (Editorial aesthetic).

## Components (Logic)
- **Mobile-First:** All design is validated in 375px before scaling.
- **Interactive:** MagicUI for Hero components and visual feedback.
- **Icons:** `icono.co` (Minimalist).

## Adaptive UX & Ergonomics

### 1. Thumb-Driven Design (Thumb Zone)
- Critical elements (Confirm appointment, Save record) must be located in the lower arc of the device.
- Main navigation via persistent **Bottom Bar** on mobile.

### 2. Modern Layouts
- **Container Queries**: Components adapt to their container, not just the viewport.
- **Fluid Typography**: Scaling using `font-size: clamp(1rem, 2vw + 1rem, 1.5rem)`.
- **Aspect Ratio**: Native use of `aspect-ratio` to avoid content shifts (Layout Shift) in treatment photos.

### 3. Feedback Táctil y Visual
- **Microinteractions**: Immediate feedback when touching a button (light vibration or 0.98x scale).
- **Adaptive Mode**: Native support for Dark/Light mode synchronized with the system.

## Critical Control Components
### PDF Language Selector
- **Location**: Bottom zone of the screen (Thumb-Zone).
- **Design**: Segmented selector of 3 large buttons (44x44px min) for quick change of clinical report language.
- **Feedback**: Haptic vibration when changing language before generation.