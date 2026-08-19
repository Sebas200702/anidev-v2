/**
 * Gradient resolution for the {@link Overlay} component.
 *
 * @module shared/components/overlay/gradient
 */
import type { OverlayProps } from './types'

const DIRECTION_MAP = {
  up: 'to top',
  down: 'to bottom',
  left: 'to left',
  right: 'to right',
} as const

const CSS_COLOR_KEYWORDS = [
  'transparent',
  'black',
  'white',
  'inherit',
  'current',
]

const CSS_COLOR_PREFIXES = ['#', 'rgb', 'hsl']

/**
 * Turns a token name into a usable CSS color.
 *
 * @remarks
 * `surface` → `var(--color-surface)`; `surface/60` → the same var at 60%
 * alpha; literal colors and CSS keywords pass through untouched.
 */
const resolveColor = (colorName: string): string => {
  if (
    CSS_COLOR_PREFIXES.some((prefix) => colorName.startsWith(prefix)) ||
    CSS_COLOR_KEYWORDS.includes(colorName)
  ) {
    return colorName
  }

  if (colorName.includes('/')) {
    const [color, alpha] = colorName.split('/')
    return `rgb(from var(--color-${color}) r g b / ${alpha}%)`
  }

  return `var(--color-${colorName})`
}

/**
 * Builds the `linear-gradient(...)` for an overlay.
 *
 * @returns A CSS `background-image` value
 *
 * @example
 * ```typescript
 * resolveOverlayGradient({ direction: 'up', fromColor: 'surface' })
 * // 'linear-gradient(to top, var(--color-surface), transparent)'
 * ```
 */
export const resolveOverlayGradient = ({
  direction,
  fromColor,
  toColor,
  viaColor,
  viaInterval,
}: OverlayProps): string => {
  const cssDirection = DIRECTION_MAP[direction]
  const fromValue = resolveColor(fromColor)
  const toValue = resolveColor(toColor ?? 'transparent')

  if (!viaColor) {
    return `linear-gradient(${cssDirection}, ${fromValue}, ${toValue})`
  }

  const viaValue = resolveColor(viaColor)
  const interval = viaInterval ? ` ${viaInterval}` : ''
  return `linear-gradient(${cssDirection}, ${fromValue}, ${viaValue}${interval}, ${toValue})`
}
