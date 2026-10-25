import { describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
}))

import { mapErrorToHttp } from '@shared/errors/map-error-to-http'
import { requestTooLarge } from '@shared/errors/request-errors'

describe('requestTooLarge', () => {
  it('maps to 413 REQUEST_TOO_LARGE', () => {
    const response = mapErrorToHttp(requestTooLarge(10))
    expect(response.status).toBe(413)
    expect(response.body.code).toBe('REQUEST_TOO_LARGE')
  })
})
