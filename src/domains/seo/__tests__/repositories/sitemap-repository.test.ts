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

const { sitemapRepository } = await import('@seo/repositories/sitemap')

describe('sitemapRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('counts eligible anime', async () => {
    select.mockReturnValue(chainResolving([{ value: 42 }]))
    expect(await sitemapRepository.countAnime()).toBe(42)
  })

  it('returns 0 when the count has no row', async () => {
    select.mockReturnValue(chainResolving([]))
    expect(await sitemapRepository.countAnime()).toBe(0)
  })

  it('returns an anime page', async () => {
    select.mockReturnValue(chainResolving([{ malId: 1, title: 'Bebop' }]))
    expect(await sitemapRepository.getAnimePage(0, 10)).toEqual([
      { malId: 1, title: 'Bebop' },
    ])
  })

  it('maps genre rows to names', async () => {
    select.mockReturnValue(chainResolving([{ name: 'Action' }]))
    expect(await sitemapRepository.getGenreNames()).toEqual(['Action'])
  })

  it('wraps database errors', async () => {
    select.mockImplementation(throwOnQuery)
    await expect(sitemapRepository.countAnime()).rejects.toBeInstanceOf(
      InfraError
    )
    await expect(sitemapRepository.getAnimePage(0, 1)).rejects.toBeInstanceOf(
      InfraError
    )
    await expect(sitemapRepository.getGenreNames()).rejects.toBeInstanceOf(
      InfraError
    )
  })
})
