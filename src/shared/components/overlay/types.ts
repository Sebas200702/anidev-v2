/**
 * Prop types for the shared {@link Overlay} component.
 *
 * @module shared/components/overlay/types
 */

/** Direction the gradient fades **towards**. */
export type OverlayDirection = 'up' | 'down' | 'left' | 'right'

/**
 * Props accepted by {@link Overlay}.
 *
 * @remarks
 * Colors are token names (`surface`, `on-surface`), a token with an alpha
 * suffix (`surface/60`), a literal CSS color (`#fff`, `rgb(...)`), or one of
 * the CSS keywords (`transparent`, `black`, `white`, `inherit`, `current`).
 *
 * @see {@link resolveOverlayGradient}
 */
export interface OverlayProps {
  direction: OverlayDirection
  fromColor: string
  toColor?: string
  viaColor?: string
  viaInterval?: string
  className?: string
}
