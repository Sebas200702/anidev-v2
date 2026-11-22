/**
 * AniList GraphQL cast client for the cast relink (T3). Pure: network, clock and sleep
 * are injected so the pagination, batching, throttle and retry rules are testable
 * offline. `fetchCast` pages one anime per request; `fetchCasts` packs many lookups per
 * request (see `anilist-batch`).
 *
 * @module scripts/db/cast-relink/anilist-client
 */
import { createBatchFetch } from './anilist-batch'
import { buildQuery, type CharacterPage, MAX_PAGES } from './anilist-query'
import { type ClientDeps, createTransport } from './anilist-transport'

export { DEFAULT_BATCH } from './anilist-batch'
export {
  ANILIST_ENDPOINT,
  type ClientDeps,
  DEFAULT_RPM,
  type FetchLike,
  MAX_RETRIES,
} from './anilist-transport'

/** One output JSONL line, as merged by sql/04-merge-api.sql. */
export interface CastLine {
  anime_id: number
  found: boolean
  edges: unknown[]
  error?: string
}

/** Builds a throttled client: at most `rpm` requests per minute across all calls. */
export const createAnilistClient = (deps: ClientDeps) => {
  const post = createTransport(deps)

  /** Fetches every cast page of a MAL anime (by AniList id when one is known). */
  const fetchCast = async (
    malId: number,
    anilistId?: number
  ): Promise<CastLine> => {
    const query = buildQuery(anilistId != null)
    const edges: unknown[] = []
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const result = await post({
        query,
        variables: { id: anilistId ?? malId, page },
      })
      if (!result.isOk)
        return { anime_id: malId, found: false, edges: [], error: result.error }
      const { status, body } = result
      if (status === 404) return { anime_id: malId, found: false, edges: [] }
      const media = body?.data?.Media as {
        characters?: CharacterPage | null
      } | null
      const characters = media?.characters
      if (status !== 200 || body?.errors?.length || !characters) {
        const message =
          body?.errors?.[0]?.message ?? 'no characters in response'
        return {
          anime_id: malId,
          found: false,
          edges: [],
          error: `HTTP ${status}: ${message}`,
        }
      }
      edges.push(...(characters.edges ?? []))
      if (!characters.pageInfo?.hasNextPage)
        return { anime_id: malId, found: true, edges }
    }
    return {
      anime_id: malId,
      found: false,
      edges: [],
      error: `more than ${MAX_PAGES} pages`,
    }
  }

  return { fetchCast, fetchCasts: createBatchFetch(post) }
}
