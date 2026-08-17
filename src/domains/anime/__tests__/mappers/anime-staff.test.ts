/**
 * Tests for {@link mapAnimeStaff}.
 *
 * @module domains/anime/__tests__/mappers/anime-staff
 * @remarks
 * Covers person mapping, role splitting into positions, the `['Unknown']` fallback when no join row
 * matches, and profile/image URLs. {@link buildMediaUrl} and `@/config` are mocked. Follows the
 * repo TDD/unit-test layout.
 */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/config', () => ({
  config: { baseUrl: 'https://anidev.test' },
}))
vi.mock('@media/mappers/media-url', () => ({
  buildMediaUrl: ({ entity_id }: { entity_id: number }) => `img:${entity_id}`,
}))

import { mapAnimeStaff } from '@anime/mappers/anime-staff'
import type { AnimeStaffDB, StaffDB } from '@anime/types'

const staff = (over: Partial<StaffDB>): StaffDB =>
  ({ malId: 1, name: 'Masashi Kishimoto', ...over }) as StaffDB

const relation = (over: Partial<AnimeStaffDB>): AnimeStaffDB =>
  ({ staffId: 1, role: 'Director,Producer', ...over }) as AnimeStaffDB

describe('mapAnimeStaff', () => {
  it('maps person fields and URLs', () => {
    const [entry] = mapAnimeStaff({
      staff: [staff({ malId: 5, name: 'Ann' })],
      animeStaff: [relation({ staffId: 5, role: 'Director' })],
    })
    expect(entry.person).toEqual({
      malId: 5,
      name: 'Ann',
      imageUrl: 'img:5',
      url: 'https://anidev.test/people/5',
    })
  })

  it('splits comma-separated roles into positions', () => {
    const [entry] = mapAnimeStaff({
      staff: [staff({ malId: 1 })],
      animeStaff: [relation({ staffId: 1, role: 'Director,Producer' })],
    })
    expect(entry.positions).toEqual(['Director', 'Producer'])
  })

  it("defaults positions to ['Unknown'] when no join row matches", () => {
    const [entry] = mapAnimeStaff({
      staff: [staff({ malId: 99 })],
      animeStaff: [],
    })
    expect(entry.positions).toEqual(['Unknown'])
  })

  it('returns an empty array for no staff', () => {
    expect(mapAnimeStaff({ staff: [], animeStaff: [] })).toEqual([])
  })
})
