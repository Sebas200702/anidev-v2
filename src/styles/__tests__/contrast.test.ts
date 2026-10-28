/**
 * @module styles/__tests__/contrast
 *
 * Ties the contrast figures quoted in `DESIGN.md` and `global.css` to the real
 * token values, so a palette change cannot silently break the 4.5:1 floor.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  fileURLToPath(new URL('../global.css', import.meta.url)),
  'utf8'
)

const MIN_TEXT_CONTRAST = 4.5

const hexOf = (name: string): string => {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!match) throw new Error(`token --${name} not found as a hex literal`)
  return match[1]
}

const luminance = (hex: string): number => {
  const [red, green, blue] = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

const contrast = (foreground: string, background: string): number => {
  const [light, dark] = [luminance(foreground), luminance(background)].sort(
    (first, second) => second - first
  )
  return (light + 0.05) / (dark + 0.05)
}

const block = (selector: string): string => {
  const start = css.indexOf(selector)
  return css.slice(start, css.indexOf('\n}', start))
}

describe('editorial contrast floor', () => {
  const surface = hexOf('color-neutral-950')
  const onSurface = hexOf('color-neutral-50')

  it('keeps accent text (brand-300) legible on the dark surface', () => {
    expect(contrast(hexOf('brand-300'), surface)).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST
    )
  })

  it('documents why brand-700 is not used as text on dark', () => {
    expect(contrast(hexOf('brand-700'), surface)).toBeLessThan(
      MIN_TEXT_CONTRAST
    )
  })

  it('keeps primary button text legible at rest and on hover', () => {
    expect(contrast(onSurface, hexOf('brand-700'))).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST
    )
    expect(contrast(onSurface, hexOf('brand-800'))).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST
    )
  })

  it('keeps destructive button text legible', () => {
    expect(
      contrast(hexOf('color-on-danger'), hexOf('color-danger'))
    ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
  })

  it('routes accent text through editorial-ink on dark', () => {
    expect(block('@theme static')).toContain(
      '--color-editorial-ink: var(--color-brand-300)'
    )
  })

  it('moves the light theme accent to brand-700 so text on it passes', () => {
    const light = block('.light {')
    expect(light).toContain('--color-editorial-accent: var(--color-brand-700)')
    expect(light).toContain('--color-editorial-ink: var(--color-brand-700)')
    expect(contrast(onSurface, hexOf('brand-700'))).toBeGreaterThanOrEqual(
      MIN_TEXT_CONTRAST
    )
    expect(
      contrast(hexOf('brand-700'), hexOf('color-neutral-100'))
    ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST)
  })
})
