import { describe, expect, it, vi } from 'vitest'

const cacheGetMock = vi.fn()
const cacheSetMock = vi.fn()

vi.mock('@lib/cache', () => ({
  cacheGet: (...args: any[]) => cacheGetMock(...args),
  cacheSet: (...args: any[]) => cacheSetMock(...args),
}))

import { mangaListCache } from '@manga/cache/manga-list/cache'

describe('mangaListCache', () => {
  it('builds a stable key', () => {
    const key = mangaListCache.key({ page: 1, limit: 10 } as any)
    expect(key).toContain('manga:list:')
  })

  it('get delegates to cacheGet', async () => {
    cacheGetMock.mockResolvedValue({ list: [], total: 0 })
    const res = await mangaListCache.get({ page: 1, limit: 10 } as any)
    expect(res).toEqual({ list: [], total: 0 })
  })

  it('set delegates to cacheSet', async () => {
    cacheSetMock.mockResolvedValue(undefined)
    await mangaListCache.set({ page: 1, limit: 10 } as any, {
      list: [],
      total: 0,
    })
    expect(cacheSetMock).toHaveBeenCalled()
  })
})
