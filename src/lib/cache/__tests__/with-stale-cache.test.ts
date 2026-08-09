/**
 * Tests for {@link withStaleCache} stale-serve degradation.
 *
 * @module lib/cache/__tests__/with-stale-cache
 * @remarks
 * Verifies that compute failures mapped to {@link InfraError} fall back to a
 * companion `:stale` key, while cache hits, successful computes, and domain
 * errors keep the pre-stale contract intact.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { DomainError, InfraError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'
import { withStaleCache } from '@lib/cache/cache-store'
import type { WithStaleCacheOptions } from '@lib/cache/cache-store-types'

const KEY = 'anime:details:5114'
const STALE_KEY = `${KEY}:stale`
const FRESH = { malId: 5114, title: 'Cowboy Bebop' }
const STALE = { malId: 5114, title: 'Cowboy Bebop (stale)' }

type GetCache = (key: string) => Promise<typeof FRESH | null>
type SetCache = (key: string, value: typeof FRESH) => Promise<void>
type Compute = () => Promise<typeof FRESH>

type MockedOptions = Omit<
  WithStaleCacheOptions<typeof FRESH>,
  'getCache' | 'getStaleCache' | 'setCache' | 'setStaleCache' | 'compute'
> & {
  getCache: Mock<GetCache>
  getStaleCache: Mock<GetCache>
  setCache: Mock<SetCache>
  setStaleCache: Mock<SetCache>
  compute: Mock<Compute>
}

const makeOptions = (
  overrides: Partial<MockedOptions> = {}
): MockedOptions => ({
  key: KEY,
  staleKey: STALE_KEY,
  getCache: overrides.getCache ?? (vi.fn() as Mock<GetCache>),
  getStaleCache: overrides.getStaleCache ?? (vi.fn() as Mock<GetCache>),
  setCache: overrides.setCache ?? (vi.fn() as Mock<SetCache>),
  setStaleCache: overrides.setStaleCache ?? (vi.fn() as Mock<SetCache>),
  compute: overrides.compute ?? (vi.fn() as Mock<Compute>),
  shouldCache: overrides.shouldCache,
})

describe('withStaleCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('serves the fresh cache hit with isStale: false', async () => {
    const options = makeOptions()
    options.getCache.mockResolvedValueOnce(FRESH)
    const compute = vi.fn()

    const result = await withStaleCache({ ...options, compute })

    expect(result).toEqual({ value: FRESH, isStale: false })
    expect(compute).not.toHaveBeenCalled()
  })

  it('computes on miss, writes both keys, and reports isStale: false', async () => {
    const options = makeOptions()
    options.getCache.mockResolvedValueOnce(null)
    const compute = vi.fn(async () => FRESH)

    const result = await withStaleCache({ ...options, compute })

    expect(result).toEqual({ value: FRESH, isStale: false })
    expect(compute).toHaveBeenCalledTimes(1)
    expect(options.setCache).toHaveBeenCalledWith(KEY, FRESH)
    expect(options.setStaleCache).toHaveBeenCalledWith(STALE_KEY, FRESH)
  })

  it('serves the stale value when compute throws InfraError', async () => {
    const options = makeOptions()
    options.getCache.mockResolvedValueOnce(null)
    options.getStaleCache.mockResolvedValueOnce(STALE)
    const compute = vi.fn(async () => {
      throw new InfraError(
        ErrorCodes.DB_ERROR,
        'Database error during getAnimeByMalId'
      )
    })

    const result = await withStaleCache({ ...options, compute })

    expect(result).toEqual({ value: STALE, isStale: true })
    expect(options.setCache).not.toHaveBeenCalled()
  })

  it('rethrows InfraError when no stale value exists', async () => {
    const options = makeOptions()
    options.getCache.mockResolvedValueOnce(null)
    options.getStaleCache.mockResolvedValueOnce(null)
    const infraError = new InfraError(
      ErrorCodes.DB_ERROR,
      'Database error during getAnimeByMalId'
    )
    const compute = vi.fn(async () => {
      throw infraError
    })

    await expect(withStaleCache({ ...options, compute })).rejects.toBe(
      infraError
    )
  })

  it('rethrows domain errors without touching the stale path', async () => {
    const options = makeOptions()
    options.getCache.mockResolvedValueOnce(null)
    const domainError = new DomainError(
      ErrorCodes.ANIME_NOT_FOUND,
      'Anime 5114 not found'
    )
    const compute = vi.fn(async () => {
      throw domainError
    })

    await expect(withStaleCache({ ...options, compute })).rejects.toBe(
      domainError
    )
    expect(options.getStaleCache).not.toHaveBeenCalled()
  })

  it('respects shouldCache: false and skips both writes', async () => {
    const options = makeOptions({ shouldCache: () => false })
    options.getCache.mockResolvedValueOnce(null)
    const compute = vi.fn(async () => FRESH)

    const result = await withStaleCache({ ...options, compute })

    expect(result).toEqual({ value: FRESH, isStale: false })
    expect(options.setCache).not.toHaveBeenCalled()
    expect(options.setStaleCache).not.toHaveBeenCalled()
  })
})
