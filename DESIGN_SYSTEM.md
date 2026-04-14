# Design System: Minimalist Luxury

## Typography (Fontsource)
- **Headings:** `Cormorant Garamond` (Elegante, Serif).
- **Body:** `Outfit` (Moderno, Minimalista, Sans-serif).

## Visual Tokens
- **Background:** `--bg-spa` (#FAFAF9).
- **Primary:** `--text-main` (#1C1917).
- **Accent:** `--accent-spa` (#D4D4D8).
- **Borders:** `rounded-none` o `rounded-sm` (Estética editorial).

## Components (Logic)
- **Mobile-First:** Todo diseño se valida en 375px antes de escalar.
- **Interactive:** MagicUI para componentes Hero y Feedback visual.
- **Icons:** `icono.co` (Minimalistas).

## Adaptive UX & Ergonomics

### 1. Thumb-Driven Design (Zona de Pulgar)
- Los elementos críticos (Confirmar cita, Guardar ficha) deben situarse en el arco inferior del dispositivo.
- Navegación principal mediante **Bottom Bar** persistente en móviles.

### 2. Modern Layouts
- **Container Queries**: Los componentes se adaptan a su contenedor, no solo al viewport.
- **Fluid Typography**: Escalamiento mediante `font-size: clamp(1rem, 2vw + 1rem, 1.5rem)`.
- **Aspect Ratio**: Uso nativo de `aspect-ratio` para evitar saltos de contenido (Layout Shift) en fotos de tratamientos.

### 3. Feedback Táctil y Visual
- **Microinteracciones**: Feedback inmediato al tocar un botón (vibración ligera o escala 0.98x).
- **Modo Adaptativo**: Soporte nativo para Dark/Light mode sincronizado con el sistema.

## 📱 Critical Control Components
### PDF Language Selector
- **Location**: Bottom zone of the screen (Thumb-Zone).
- **Design**: Segmented selector of 3 large buttons (44x44px min) for quick change of clinical report language.
- **Feedback**: Haptic vibration when changing language before generation.