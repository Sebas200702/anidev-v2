/**
 * AniList GraphQL documents for the cast relink: the single-anime paged query and the
 * batched query that packs several (anime, page) lookups as aliases `a0`, `a1`, …
 * Both select the same edge fields, so every output line has the same shape.
 *
 * @module scripts/db/cast-relink/anilist-query
 */

export const MAX_PAGES = 200
const PER_PAGE = 25

const CAST_FIELDS = `pageInfo { hasNextPage }
      edges { role node { id name { full native alternative } image { large } } }`

const characters = (page: string) =>
  `characters(page: ${page}, perPage: ${PER_PAGE}, sort: [ROLE, ID]) {
      ${CAST_FIELDS}
    }`

export interface CharacterPage {
  pageInfo?: { hasNextPage?: boolean }
  edges?: unknown[]
}

export interface CastLookup {
  malId: number
  anilistId?: number
  page: number
}

export const buildQuery = (
  byAnilistId: boolean
) => `query ($id: Int, $page: Int) {
  Media(${byAnilistId ? 'id' : 'idMal'}: $id, type: ANIME) {
    ${characters('$page')}
  }
}`

export const aliasOf = (index: number) => `a${index}`

/** One request body holding every lookup as an aliased `Media` (ids are integers). */
export const buildBatchQuery = (lookups: CastLookup[]) => {
  const fields = lookups.map(({ malId, anilistId, page }, index) => {
    const key = anilistId != null ? `id: ${anilistId}` : `idMal: ${malId}`
    return `  ${aliasOf(index)}: Media(${key}, type: ANIME) { ${characters(String(page))} }`
  })
  return `query {\n${fields.join('\n')}\n}`
}
