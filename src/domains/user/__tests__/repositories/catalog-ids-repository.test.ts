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

const { catalogIdsRepository } = await import('@user/repositories/catalog-ids')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('catalogIdsRepository.findMissing', () => {
  it('skips empty lists without querying', async () => {
    expect(await catalogIdsRepository.findMissing({})).toEqual({
      genres: [],
      studios: [],
      animes: [],
    })
    expect(select).not.toHaveBeenCalled()
  })

  it('returns the ids without a row', async () => {
    select.mockReturnValue(chainResolving([{ id: 1 }]))
    const missing = await catalogIdsRepository.findMissing({ genres: [1, 999] })
    expect(missing.genres).toEqual([999])
  })

  it('wraps failures', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(
      catalogIdsRepository.findMissing({ animes: [1] })
    ).rejects.toBeInstanceOf(InfraError)
  })
})
