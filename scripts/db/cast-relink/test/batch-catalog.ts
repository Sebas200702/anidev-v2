/**
 * Fake AniList catalog for the batched fetch tests: parses the aliased lookups of a
 * recorded request and answers each from an in-memory cast table.
 *
 * @module scripts/db/cast-relink/test/batch-catalog
 */
import type { CastLine } from '../anilist-client'
import type { harness, RecordedRequest } from './harness'

const ALIAS =
  /(a\d+): Media\((id|idMal): (\d+), type: ANIME\) \{ characters\(page: (\d+)/g

export const aliasesOf = (request: RecordedRequest) =>
  [...request.body.query.matchAll(ALIAS)].map(([, alias, key, id, page]) => ({
    alias,
    key,
    id: Number(id),
    page: Number(page),
  }))

type Override = (alias: string, id: number) => { error?: object } | undefined

/** Answers every alias from `casts` (id → pages of character ids); absent → null. */
export const catalog =
  (casts: Record<number, number[][]>, override: Override = () => undefined) =>
  (request: RecordedRequest) => {
    const data: Record<string, unknown> = {}
    const errors: object[] = []
    for (const { alias, id, page } of aliasesOf(request)) {
      const forced = override(alias, id)
      if (forced?.error) {
        data[alias] = null
        errors.push({ ...forced.error, path: [alias] })
        continue
      }
      const pages = casts[id]
      data[alias] = pages
        ? {
            characters: {
              pageInfo: { hasNextPage: page < pages.length },
              edges: pages[page - 1].map((cid) => ({
                role: 'MAIN',
                node: { cid },
              })),
            },
          }
        : null
    }
    return Response.json(errors.length ? { data, errors } : { data })
  }

export const run = async (
  client: ReturnType<typeof harness>['client'],
  ids: number[],
  batchSize: number,
  anilistIds: Record<number, number> = {}
) => {
  const lines: CastLine[] = []
  await client.fetchCasts(
    ids.map((malId) => ({ malId, anilistId: anilistIds[malId] })),
    { batchSize, onLine: (line) => void lines.push(line) }
  )
  return lines
}
