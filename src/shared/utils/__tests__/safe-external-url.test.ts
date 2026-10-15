/**
 * Tests for {@link assertSafeExternalUrl}.
 *
 * @module shared/utils/__tests__/safe-external-url
 */
import { describe, expect, it } from 'vitest'
import { DomainError } from '@shared/errors/app-error'
import { assertSafeExternalUrl } from '@shared/utils/safe-external-url'

describe('assertSafeExternalUrl', () => {
  it('accepts a public https URL', () => {
    expect(() =>
      assertSafeExternalUrl('https://cdn.myanimelist.net/image.jpg')
    ).not.toThrow()
  })

  it.each([
    'http://cdn.example/image.jpg',
    'ftp://cdn.example/image.jpg',
    'javascript:alert(1)',
    'data:text/html,<h1>hi</h1>',
    'https://user:pass@cdn.example/image.jpg',
    'https://localhost/image.jpg',
    'https://foo.localhost/image.jpg',
    'https://metadata.google.internal/image.jpg',
    'https://127.0.0.1/image.jpg',
    'https://10.0.0.5/image.jpg',
    'https://172.16.0.5/image.jpg',
    'https://192.168.1.5/image.jpg',
    'https://169.254.169.254/image.jpg',
    'https://[::1]/image.jpg',
    'https://[fe80::1]/image.jpg',
    'not-a-url',
  ])('rejects %s as DomainError', (url) => {
    expect(() => assertSafeExternalUrl(url)).toThrow(DomainError)
  })
})
