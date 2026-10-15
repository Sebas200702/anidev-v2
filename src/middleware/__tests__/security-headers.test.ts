/**
 * Tests for security header application.
 *
 * @module middleware/__tests__/security-headers
 */
import { describe, expect, it } from 'vitest'
import { applySecurityHeaders } from '@middleware/security-headers'
import { CONTENT_SECURITY_POLICY } from '@middleware/security-headers'

const htmlResponse = () =>
  new Response('<html></html>', {
    headers: { 'Content-Type': 'text/html' },
  })

describe('applySecurityHeaders', () => {
  it('sets hardening headers and the request id on every response', () => {
    const response = applySecurityHeaders(
      new Response(JSON.stringify({}), {
        headers: { 'Content-Type': 'application/json' },
      }),
      'req-1'
    )

    expect(response.headers.get('x-request-id')).toBe('req-1')
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('x-frame-options')).toBe('DENY')
    expect(response.headers.get('referrer-policy')).toBe(
      'strict-origin-when-cross-origin'
    )
  })

  it('emits CSP as a real header for documents only', () => {
    const document = applySecurityHeaders(htmlResponse(), 'req-2')
    expect(document.headers.get('content-security-policy')).toBe(
      CONTENT_SECURITY_POLICY
    )
    expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'")

    const api = applySecurityHeaders(
      new Response(JSON.stringify({}), {
        headers: { 'Content-Type': 'application/json' },
      }),
      'req-3'
    )
    expect(api.headers.get('content-security-policy')).toBeNull()
  })

  it('passes through non-response values', () => {
    expect(applySecurityHeaders(undefined, 'req-4')).toBeUndefined()
  })
})
