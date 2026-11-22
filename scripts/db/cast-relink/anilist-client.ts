/**
 * AniList GraphQL cast client for the cast relink (T3). Pure: network, clock and sleep
 * are injected so the pagination, throttle and retry rules are testable offline.
 *
 * @module scripts/db/cast-relink/anilist-client
 */

export const ANILIST_ENDPOINT = 'https://graphql.anilist.co'
export const DEFAULT_RPM = 30
export const MAX_RETRIES = 3
const MAX_RATE_LIMITED = 10
const MAX_PAGES = 200
const DEFAULT_RETRY_AFTER_SECONDS = 60
const USER_AGENT = 'cast-relink/1.0'

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>

export interface ClientDeps {
  fetch: FetchLike
  sleep: (milliseconds: number) => Promise<void>
  now: () => number
  rpm: number
}

/** One output JSONL line, as merged by sql/04-merge-api.sql. */
export interface CastLine {
  anime_id: number
  found: boolean
  edges: unknown[]
  error?: string
}

type PostResult =
  | { isOk: true; status: number; body: GraphqlBody | null }
  | { isOk: false; error: string }

interface GraphqlBody {
  data?: { Media?: { characters?: CharacterPage | null } | null } | null
  errors?: { message?: string }[]
}

interface CharacterPage {
  pageInfo?: { hasNextPage?: boolean }
  edges?: unknown[]
}

const buildQuery = (byAnilistId: boolean) => `query ($id: Int, $page: Int) {
  Media(${byAnilistId ? 'id' : 'idMal'}: $id, type: ANIME) {
    characters(page: $page, perPage: 25, sort: [ROLE, ID]) {
      pageInfo { hasNextPage }
      edges { role node { id name { full native alternative } image { large } } }
    }
  }
}`

const retryAfterMs = (response: Response) => {
  const seconds = Number(response.headers.get('retry-after'))
  const wait =
    Number.isFinite(seconds) && seconds > 0
      ? seconds
      : DEFAULT_RETRY_AFTER_SECONDS
  return (wait + 1) * 1000
}

/** Builds a throttled client: at most `rpm` requests per minute across all calls. */
export const createAnilistClient = (deps: ClientDeps) => {
  const intervalMs = 60_000 / deps.rpm
  let lastRequestAt = Number.NEGATIVE_INFINITY

  const throttle = async () => {
    const wait = lastRequestAt + intervalMs - deps.now()
    if (wait > 0) await deps.sleep(wait)
    lastRequestAt = deps.now()
  }

  const post = async (payload: unknown): Promise<PostResult> => {
    let failures = 0
    let rateLimited = 0
    for (;;) {
      await throttle()
      let response: Response
      try {
        response = await deps.fetch(ANILIST_ENDPOINT, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            accept: 'application/json',
            'user-agent': USER_AGENT,
          },
          body: JSON.stringify(payload),
        })
      } catch (error) {
        failures += 1
        if (failures > MAX_RETRIES)
          return { isOk: false, error: `network: ${String(error)}` }
        await deps.sleep(2000 * 2 ** (failures - 1))
        continue
      }
      if (response.status === 429) {
        rateLimited += 1
        if (rateLimited > MAX_RATE_LIMITED)
          return { isOk: false, error: 'HTTP 429' }
        await deps.sleep(retryAfterMs(response))
        continue
      }
      if (response.status >= 500) {
        failures += 1
        if (failures > MAX_RETRIES)
          return { isOk: false, error: `HTTP ${response.status}` }
        await deps.sleep(2000 * 2 ** (failures - 1))
        continue
      }
      const body = (await response
        .json()
        .catch(() => null)) as GraphqlBody | null
      return { isOk: true, status: response.status, body }
    }
  }

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
      const characters = body?.data?.Media?.characters
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

  return { fetchCast }
}
