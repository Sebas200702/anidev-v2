/**
 * Throttled AniList GraphQL transport for the cast relink (T3): one `post` = one HTTP
 * request, spaced to at most `rpm` per minute, honoring 429 Retry-After and retrying
 * 5xx / network errors with backoff. Network, clock and sleep are injected.
 *
 * @module scripts/db/cast-relink/anilist-transport
 */

export const ANILIST_ENDPOINT = 'https://graphql.anilist.co'
export const DEFAULT_RPM = 30
export const MAX_RETRIES = 3
const MAX_RATE_LIMITED = 10
const DEFAULT_RETRY_AFTER_SECONDS = 60
const USER_AGENT = 'cast-relink/1.0'

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>

export interface ClientDeps {
  fetch: FetchLike
  sleep: (milliseconds: number) => Promise<void>
  now: () => number
  rpm: number
}

export interface GraphqlError {
  message?: string
  status?: number
  path?: (string | number)[]
}

export interface GraphqlBody {
  data?: Record<string, unknown> | null
  errors?: GraphqlError[]
}

export type PostResult =
  | { isOk: true; status: number; body: GraphqlBody | null }
  | { isOk: false; error: string }

const retryAfterMs = (response: Response) => {
  const seconds = Number(response.headers.get('retry-after'))
  const wait =
    Number.isFinite(seconds) && seconds > 0
      ? seconds
      : DEFAULT_RETRY_AFTER_SECONDS
  return (wait + 1) * 1000
}

/** Builds the throttled `post`: at most `rpm` HTTP requests per minute across calls. */
export const createTransport = (deps: ClientDeps) => {
  const intervalMs = 60_000 / deps.rpm
  let lastRequestAt = Number.NEGATIVE_INFINITY

  const throttle = async () => {
    const wait = lastRequestAt + intervalMs - deps.now()
    if (wait > 0) await deps.sleep(wait)
    lastRequestAt = deps.now()
  }

  return async (payload: unknown): Promise<PostResult> => {
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
}
