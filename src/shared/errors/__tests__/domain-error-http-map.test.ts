import { describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))

vi.mock('@sentry/node', () => ({
  captureException: vi.fn(),
}))

import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'
import { mapErrorToHttp } from '@shared/errors/map-error-to-http'

describe('mapErrorToHttp storage domain codes', () => {
  it('maps STORAGE_NOT_CONFIGURED to 404', () => {
    const error = new DomainError(ErrorCodes.STORAGE_NOT_CONFIGURED, 'x')
    expect(mapErrorToHttp(error).status).toBe(404)
  })

  it('maps UNSUPPORTED_MEDIA_TYPE to 415 with its code', () => {
    const error = new DomainError(ErrorCodes.UNSUPPORTED_MEDIA_TYPE, 'x')
    const response = mapErrorToHttp(error)
    expect(response.status).toBe(415)
    expect(response.body.code).toBe('UNSUPPORTED_MEDIA_TYPE')
  })
})
