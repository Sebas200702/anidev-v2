/**
 * Tests for log redaction ({@link LOG_REDACT_PATHS}).
 *
 * @module shared/utils/__tests__/logger-redact
 * @remarks
 * Builds a throwaway pino instance with the production redact config and a
 * capturing stream, then asserts cookies, tokens, and passwords never reach
 * the output. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))

import pino from 'pino'
import { LOG_REDACT_PATHS } from '@utils/logger-util'

const capture = () => {
  const chunks: string[] = []
  const stream = { write: (chunk: string) => chunks.push(chunk) }
  const log = pino(
    {
      level: 'info',
      redact: { paths: LOG_REDACT_PATHS, censor: '[redacted]' },
    },
    stream as never
  )
  return { chunks, log }
}

describe('log redaction', () => {
  it('censors cookies, tokens, and passwords', () => {
    const { chunks, log } = capture()
    log.info(
      {
        cookie: 'session_token=abc',
        nested: { token: 'secret', password: 'hunter2' },
        email: 'user@example.com',
      },
      'probe'
    )

    const output = chunks.join('')
    expect(output).not.toContain('session_token=abc')
    expect(output).not.toContain('secret')
    expect(output).not.toContain('hunter2')
    expect(output).toContain('[redacted]')
  })
})
