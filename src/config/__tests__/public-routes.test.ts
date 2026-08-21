/**
 * Tests for the public-route allowlist.
 *
 * @module config/__tests__/public-routes
 * @remarks
 * Prefix matching is the contract the auth middleware relies on, so both the
 * exact match and the nested case are asserted, along with the routes that must
 * stay behind a session.
 */
import { describe, expect, it } from 'vitest'
import { isPublicRoute, publicRoutes } from '@config/public-routes'

describe('isPublicRoute', () => {
  it('accepts an exact listed route', () => {
    for (const route of publicRoutes) {
      expect(isPublicRoute(route)).toBe(true)
    }
  })

  it('accepts a path nested under a listed prefix', () => {
    expect(isPublicRoute('/api/anime/carousel')).toBe(true)
    expect(isPublicRoute('/media/anime/1/poster/large')).toBe(true)
  })

  it('exposes the component showcase', () => {
    expect(isPublicRoute('/showcase')).toBe(true)
  })

  it('rejects a path that only shares a prefix string', () => {
    expect(isPublicRoute('/showcase-private')).toBe(false)
    expect(isPublicRoute('/api/animexyz')).toBe(false)
  })

  it('rejects routes that require a session', () => {
    expect(isPublicRoute('/api/search-history')).toBe(false)
    expect(isPublicRoute('/profile')).toBe(false)
  })
})
