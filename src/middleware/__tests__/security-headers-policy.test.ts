/**
 * Tests for the env-driven Content Security Policy builder.
 *
 * @module middleware/__tests__/security-headers-policy
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { S3_PUBLIC_URL: 'http://localhost:9000/anidev-media' },
}))

import {
  buildContentSecurityPolicy,
  CONTENT_SECURITY_POLICY,
  META_CONTENT_SECURITY_POLICY,
} from '@middleware/security-headers'

const imgSrc = (policy: string) =>
  policy.split('; ').find((directive) => directive.startsWith('img-src'))

describe('buildContentSecurityPolicy', () => {
  it('keeps the static img-src when storage is not configured', () => {
    const directive = imgSrc(buildContentSecurityPolicy())
    expect(directive).toContain("'self'")
    expect(directive).not.toContain('localhost:9000')
  })

  it('adds only the storage origin to img-src', () => {
    const directive = imgSrc(
      buildContentSecurityPolicy('https://media.example.com/bucket/')
    )
    expect(directive).toMatch(/ https:\/\/media\.example\.com$/)
  })

  it('derives the header and meta policies from env', () => {
    expect(imgSrc(CONTENT_SECURITY_POLICY)).toContain('http://localhost:9000')
    expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'")
    expect(META_CONTENT_SECURITY_POLICY).not.toContain('frame-ancestors')
    expect(imgSrc(META_CONTENT_SECURITY_POLICY)).toContain(
      'http://localhost:9000'
    )
  })
})
