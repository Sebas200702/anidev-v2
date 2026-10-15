/**
 * Tests for the media normalization helpers.
 *
 * @module shared/__tests__/utils/image/normalize-media-util
 * @remarks
 * Covers index clamping ({@link normalizeMediaId}) and size normalization ({@link normalizeAssetSize}).
 * Follows the repo TDD/unit-test layout.
 */
import { describe, expect, it } from 'vitest'
import { MediaSize } from '@media/types/media-types'
import {
  normalizeAssetSize,
  normalizeMediaId,
} from '@utils/image/normalize-media-util'

describe('normalizeMediaId', () => {
  it('clamps values above the total', () => {
    expect(normalizeMediaId(99, 5)).toBe(5)
  })

  it('defaults missing or non-positive ids to 1', () => {
    expect(normalizeMediaId(undefined, 10)).toBe(1)
    expect(normalizeMediaId(0, 10)).toBe(1)
    expect(normalizeMediaId(-3, 10)).toBe(1)
  })

  it('returns the id when within range', () => {
    expect(normalizeMediaId(3, 10)).toBe(3)
  })
})

describe('normalizeAssetSize', () => {
  it('passes through small and large', () => {
    expect(normalizeAssetSize('small')).toBe(MediaSize.SMALL)
    expect(normalizeAssetSize('large')).toBe(MediaSize.LARGE)
  })

  it('maps unknown or null to default', () => {
    expect(normalizeAssetSize('medium')).toBe(MediaSize.DEFAULT)
    expect(normalizeAssetSize(null)).toBe(MediaSize.DEFAULT)
  })
})
