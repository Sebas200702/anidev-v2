/**
 * Tests for the derived {@link config} object and the media service config.
 *
 * @module config/__tests__/config-index
 * @remarks
 * Mocks `@config/env` so the derived site config builds deterministically, then asserts the base URL
 * normalization (trailing slash stripped) and that {@link mediaServiceConfig} derives its placeholder
 * from it. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', APP_BASE_URL: 'https://anidev.test/' },
}))

const { config } = await import('@config/index')
const { mediaServiceConfig } = await import('@media/config')

describe('config', () => {
  it('strips the trailing slash from the base URL and derives image/title', () => {
    expect(config.baseUrl).toBe('https://anidev.test')
    expect(config.baseImage).toBe('https://anidev.test/og-image.png')
    expect(config.baseTitle).toBe('AniDev')
  })
})

describe('mediaServiceConfig', () => {
  it('derives the placeholder URL from the base URL and lists supported assets', () => {
    expect(mediaServiceConfig.defaultPlaceholderUrl).toBe(
      'https://anidev.test/placeholder.webp'
    )
    expect(mediaServiceConfig.supportedEntities).toContain('anime')
    expect(mediaServiceConfig.supportedMediaTypes).toContain('poster')
    expect(mediaServiceConfig.defaultQuality).toBe(75)
  })
})
