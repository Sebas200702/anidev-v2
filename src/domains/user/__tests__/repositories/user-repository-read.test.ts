/**
 * Test for {@link userRepository.getUserProfileById}.
 *
 * @module domains/user/__tests__/repositories/user-repository-read
 * @remarks
 * The Drizzle client is mocked with a chainable stub. Covers the first-row read and the `dbError`
 * catch branch. Follows the repo TDD/unit-test layout.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InfraError } from '@shared/errors/app-error'
import {
  chainResolving,
  throwOnQuery,
} from '@shared/__tests__/helpers/drizzle-mock'

vi.mock('@config/env', () => ({
  env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
}))

const { select } = vi.hoisted(() => ({ select: vi.fn() }))
vi.mock('@db/client', () => ({ db: { select } }))

const { userRepository } = await import('@user/repositories/user')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('userRepository.getUserProfileById', () => {
  it('returns the first profile row', async () => {
    select.mockReturnValue(chainResolving([{ id: 'bob' }]))
    expect(await userRepository.getUserProfileById('bob')).toEqual({
      id: 'bob',
    })
  })

  it('wraps errors as InfraError', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      userRepository.getUserProfileById('bob')
    ).rejects.toBeInstanceOf(InfraError)
  })
})
