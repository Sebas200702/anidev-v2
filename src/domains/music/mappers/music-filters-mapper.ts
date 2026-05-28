/**
 * Maps raw list query parameters into normalized filter objects.
 *
 * @module domains/music/mappers/music-filters-mapper
 */
import type {
  MusicListFilters,
  MusicListFiltersParams,
} from '@domains/music/types'

const TYPE_CODE_BY_LABEL: Record<string, MusicListFilters['type']> = {
  opening: 'OP',
  ending: 'ED',
  unknown: 'UNK',
  op: 'OP',
  ed: 'ED',
  unk: 'UNK',
  OP: 'OP',
  ED: 'ED',
  UNK: 'UNK',
}

/**
 * Coerces a raw type query value to a database type code.
 *
 * @internal
 */
const normalizeType = (
  raw?: string
): MusicListFilters['type'] | undefined => {
  const trimmed = raw?.trim()
  if (!trimmed) return undefined

  const fromMap =
    TYPE_CODE_BY_LABEL[trimmed] ?? TYPE_CODE_BY_LABEL[trimmed.toLowerCase()]
  if (fromMap) return fromMap

  if (trimmed === 'OP' || trimmed === 'ED' || trimmed === 'UNK') {
    return trimmed
  }

  return undefined
}

/**
 * Normalizes request query parameters into repository-ready filters.
 *
 * @param params - Raw query from {@link musicListFiltersParamsSchema}
 * @returns {@link MusicListFilters} with DB `type` codes when a type filter is present
 *
 * @remarks
 * Used by {@link musicListService} for repository queries and
 * {@link musicListCache.key} (must stay stable for cache hits).
 *
 * @example
 * ```typescript
 * mapMusicListFilters({ page: 1, limit: 10, type: 'opening' })
 * // { page: 1, limit: 10, type: 'OP', ... }
 * ```
 *
 * @see {@link buildMusicListFilters}
 */
export const mapMusicListFilters = (
  params: MusicListFiltersParams
): MusicListFilters => {
  return {
    page: params.page,
    limit: params.limit,
    type: normalizeType(params.type),
    query: params.query?.trim() || undefined,
  }
}
