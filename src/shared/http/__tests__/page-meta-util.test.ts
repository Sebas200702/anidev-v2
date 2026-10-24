import { describe, expect, it } from 'vitest'
import { buildPageMeta } from '@shared/http/page-meta-util'

describe('buildPageMeta', () => {
  it('flags a next page while items remain', () => {
    expect(buildPageMeta({ page: 2, limit: 20 }, 45, false)).toEqual({
      stale: false,
      page: 2,
      total: 45,
      hasNext: true,
    })
  })

  it('has no next page on the last one', () => {
    expect(buildPageMeta({ page: 3, limit: 20 }, 45, true).hasNext).toBe(false)
  })
})
