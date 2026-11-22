/**
 * Batched AniList cast fetch (T3): each HTTP request carries up to `batchSize` aliased
 * (anime, page) lookups from a work queue. An anime with `hasNextPage` re-enters the
 * queue with its next page; its line is emitted once, when every page is in.
 *
 * @module scripts/db/cast-relink/anilist-batch
 */
import type { CastLine } from './anilist-client'
import {
  aliasOf,
  buildBatchQuery,
  type CastLookup,
  type CharacterPage,
  MAX_PAGES,
} from './anilist-query'
import {
  type GraphqlError,
  MAX_RETRIES,
  type PostResult,
} from './anilist-transport'

export const DEFAULT_BATCH = 10

export interface CastTarget {
  malId: number
  anilistId?: number
}

export interface BatchOptions {
  batchSize: number
  onLine: (line: CastLine) => unknown
}

interface WorkItem extends CastLookup {
  edges: unknown[]
  failures: number
}

type Post = (payload: unknown) => Promise<PostResult>

const isNotFound = (error: GraphqlError) =>
  error.status === 404 || /not found/i.test(error.message ?? '')

const isComplexity = (error: GraphqlError) =>
  /complexity/i.test(error.message ?? '')

/** Fetches every target's full cast, emitting one line per anime via `onLine`. */
export const createBatchFetch =
  (post: Post) => async (targets: CastTarget[], options: BatchOptions) => {
    const fresh = targets.values()
    const queue: WorkItem[] = []
    let batchSize = Math.max(1, Math.floor(options.batchSize))

    const finish = async (item: WorkItem, line: Omit<CastLine, 'anime_id'>) =>
      options.onLine({ anime_id: item.malId, ...line })
    const fail = async (item: WorkItem, error: string) => {
      item.failures += 1
      if (item.failures <= MAX_RETRIES) return void queue.push(item)
      await finish(item, { found: false, edges: [], error })
    }
    const takeBatch = () => {
      const batch = queue.splice(0, batchSize)
      while (batch.length < batchSize) {
        const next = fresh.next()
        if (next.done) break
        batch.push({ ...next.value, page: 1, edges: [], failures: 0 })
      }
      return batch
    }

    const settle = async (
      item: WorkItem,
      alias: string,
      status: number,
      data: Record<string, unknown> | null | undefined,
      errors: GraphqlError[]
    ) => {
      const own = errors.filter((error) => error.path?.[0] === alias)
      if (own.length && own.every(isNotFound))
        return finish(item, { found: false, edges: [] })
      const firstError = own[0] ?? errors.find((error) => !error.path?.length)
      if (own.length || data == null || !(alias in data))
        return fail(item, `HTTP ${status}: ${firstError?.message ?? 'no data'}`)
      const media = data[alias] as { characters?: CharacterPage | null } | null
      if (media == null) return finish(item, { found: false, edges: [] })
      if (!media.characters)
        return fail(item, `HTTP ${status}: no characters in response`)
      item.edges.push(...(media.characters.edges ?? []))
      if (!media.characters.pageInfo?.hasNextPage)
        return finish(item, { found: true, edges: item.edges })
      if (item.page >= MAX_PAGES)
        return finish(item, {
          found: false,
          edges: [],
          error: `more than ${MAX_PAGES} pages`,
        })
      queue.push({ ...item, page: item.page + 1, failures: 0 })
    }

    for (let batch = takeBatch(); batch.length; batch = takeBatch()) {
      const result = await post({ query: buildBatchQuery(batch) })
      if (!result.isOk) {
        for (const item of batch)
          await finish(item, { found: false, edges: [], error: result.error })
        continue
      }
      const { status, body } = result
      const errors = body?.errors ?? []
      if (errors.some(isComplexity) && batch.length > 1) {
        batchSize = Math.max(1, Math.floor(batch.length / 2))
        queue.unshift(...batch)
        continue
      }
      for (const [index, item] of batch.entries())
        await settle(item, aliasOf(index), status, body?.data, errors)
    }
    return { batchSize }
  }
