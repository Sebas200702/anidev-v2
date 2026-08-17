/**
 * Tests for {@link mapMusicDetail}.
 *
 * @module domains/music/__tests__/mappers/music-detail
 * @remarks
 * Covers type normalization, artist fallbacks, nested version→resolution assembly, and the safe
 * defaults for missing audio/video URLs. Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it } from 'vitest'
import { mapMusicDetail } from '@music/mappers/music-detail'
import type {
  MusicArtistDB,
  MusicDB,
  MusicResolutionDB,
  MusicVersionDB,
} from '@music/types/music-db-types'

const music = (over: Partial<MusicDB>): MusicDB =>
  ({ id: 1, title: 'Blue Bird', type: 'OP', ...over }) as MusicDB

const version = (over: Partial<MusicVersionDB>): MusicVersionDB =>
  ({
    id: 100,
    musicId: 1,
    version: 'TV',
    versionId: 100,
    ...over,
  }) as MusicVersionDB

const resolution = (over: Partial<MusicResolutionDB>): MusicResolutionDB =>
  ({
    id: 1,
    audioUrl: 'a.mp3',
    videoUrl: 'v.mp4',
    resolution: '1080p',
    songId: 1,
    ...over,
  }) as MusicResolutionDB

describe('mapMusicDetail', () => {
  it('normalizes type and maps artists', () => {
    const d = mapMusicDetail({
      music: music({ type: 'ED' }),
      artists: [{ malId: 5, name: 'X' } as MusicArtistDB],
      versions: [],
      resolutionsByVersionId: {},
    })
    expect(d.type).toBe('ending')
    expect(d.typeCode).toBe('ED')
    expect(d.artist).toEqual([{ malId: 5, name: 'X' }])
  })

  it('applies artist fallbacks for missing fields', () => {
    const d = mapMusicDetail({
      music: music({}),
      artists: [{ malId: null, name: null } as unknown as MusicArtistDB],
      versions: [],
      resolutionsByVersionId: {},
    })
    expect(d.artist).toEqual([{ malId: 0, name: 'Unknown Artist' }])
  })

  it('nests resolutions under their version', () => {
    const d = mapMusicDetail({
      music: music({}),
      artists: [],
      versions: [version({ versionId: 100 })],
      resolutionsByVersionId: { 100: [resolution({ id: 9 })] },
    })
    expect(d.versions).toHaveLength(1)
    expect(d.versions[0].resolutions).toEqual([
      {
        id: 9,
        audioUrl: 'a.mp3',
        videoUrl: 'v.mp4',
        resolution: '1080p',
        songId: 1,
      },
    ])
  })

  it('defaults missing audio and video URLs to empty strings', () => {
    const d = mapMusicDetail({
      music: music({}),
      artists: [],
      versions: [version({ versionId: 100 })],
      resolutionsByVersionId: {
        100: [resolution({ audioUrl: null, videoUrl: null })],
      },
    })
    expect(d.versions[0].resolutions[0].audioUrl).toBe('')
    expect(d.versions[0].resolutions[0].videoUrl).toBe('')
  })

  it('uses an empty resolution list when the version has none', () => {
    const d = mapMusicDetail({
      music: music({}),
      artists: [],
      versions: [version({ versionId: 100 })],
      resolutionsByVersionId: {},
    })
    expect(d.versions[0].resolutions).toEqual([])
  })
})
