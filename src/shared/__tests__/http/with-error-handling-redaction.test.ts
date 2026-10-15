/**
 * Tests for error-log redaction in {@link withErrorHandling}.
 *
 * @module shared/__tests__/http/with-error-handling-redaction
 * @remarks
 * The error log line carries only whitelisted fields (`status`, `code`,
 * `requestId`); payloads, headers (cookies), and provider details never reach
 * the logs. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it, vi } from 'vitest'
import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

vi.mock('@config/env', () => ({ env: { NODE_ENV: 'test' } }))

const { loggerError } = vi.hoisted(() => ({ loggerError: vi.fn() }))
vi.mock('@utils/logger-util', () => ({
  logger: { error: loggerError, warn: vi.fn(), info: vi.fn() },
}))
vi.mock('@shared/errors/capture-error', () => ({ captureError: vi.fn() }))

const { withErrorHandling } = await import('@shared/http/with-error-handling')

describe('withErrorHandling error logging', () => {
  it('logs whitelisted fields with requestId and no payload/headers/secrets', async () => {
    const route = withErrorHandling(async () => {
      throw new DomainError(ErrorCodes.ANIME_INVALID_ID, 'bad id', {
        email: 'user@example.com',
        token: 'secret-token',
      })
    })
    const context = {
      locals: { requestId: 'req-123' },
    } as Parameters<ReturnType<typeof withErrorHandling>>[0]

    const res = await route(context)

    expect(res.status).toBe(400)
    // No error line — mapper or wrapper — may carry PII, payloads, or headers.
    for (const [logged] of loggerError.mock.calls) {
      const serialized = JSON.stringify(logged)
      expect(serialized).not.toContain('user@example.com')
      expect(serialized).not.toContain('secret-token')
      expect(serialized).not.toContain('payload')
      expect(serialized).not.toContain('headers')
    }
    const wrapperCall = loggerError.mock.calls.find(
      ([, message]) => message === 'Error in API route'
    )
    expect(wrapperCall?.[0]).toMatchObject({
      status: 400,
      code: ErrorCodes.ANIME_INVALID_ID,
      requestId: 'req-123',
    })
  })
})
