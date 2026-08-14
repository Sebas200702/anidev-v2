/**
 * Tests for the `responseSchema` option of {@link withErrorHandling}.
 *
 * @module shared/__tests__/http/with-error-handling
 */
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createApiResponseSchema } from '@shared/schemas/api-schema'

vi.mock('@config/env', () => ({ env: { NODE_ENV: 'test' } }))
vi.mock('@utils/logger-util', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))
vi.mock('@shared/errors/capture-error', () => ({ captureError: vi.fn() }))

const { withErrorHandling } = await import('@shared/http/with-error-handling')

const context = {} as Parameters<ReturnType<typeof withErrorHandling>>[0]
const itemSchema = createApiResponseSchema(
  z.array(z.object({ id: z.number() }))
)

describe('withErrorHandling — responseSchema', () => {
  it('passes through valid data and returns the success envelope', async () => {
    const route = withErrorHandling(
      () => ({ data: [{ id: 1 }], status: 200, meta: { page: 1 } }),
      { responseSchema: itemSchema }
    )
    const res = await route(context)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toEqual([{ id: 1 }])
    expect(body.meta).toEqual({ page: 1 })
  })

  it('returns 500 RESPONSE_VALIDATION_ERROR when data is malformed', async () => {
    const route = withErrorHandling(
      () => ({ data: [{ id: 'not-a-number' }], status: 200 }),
      { responseSchema: itemSchema }
    )
    const res = await route(context)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.code).toBe('RESPONSE_VALIDATION_ERROR')
    expect(body.data).toBeNull()
  })

  it('skips validation when no responseSchema is provided', async () => {
    const route = withErrorHandling(() => ({
      data: [{ id: 'anything' }],
      status: 200,
    }))
    const res = await route(context)

    expect(res.status).toBe(200)
  })
})
