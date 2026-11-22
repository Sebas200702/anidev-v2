/**
 * Offline harness for the AniList client tests: fake clock, recorded sleeps and an
 * injected fetch answering from a reply list or a responder function.
 *
 * @module scripts/db/cast-relink/test/harness
 */
import { createAnilistClient, type MediaType } from '../anilist-client'

export type Reply = Response | Error

export interface RecordedRequest {
  body: { query: string; variables?: { id: number; page: number } }
  at: number
  headers: Record<string, string>
}

type Responder = (request: RecordedRequest) => Reply

export const page = (ids: number[], hasNextPage: boolean) =>
  Response.json({
    data: {
      Media: {
        characters: {
          pageInfo: { hasNextPage },
          edges: ids.map((id) => ({ role: 'MAIN', node: { id } })),
        },
      },
    },
  })

export const harness = (
  replies: Reply[] | Responder,
  rpm = 30,
  mediaType?: MediaType
) => {
  let clock = 0
  const requests: RecordedRequest[] = []
  const sleeps: number[] = []
  const client = createAnilistClient({
    rpm,
    mediaType,
    now: () => clock,
    sleep: async (milliseconds) => {
      sleeps.push(milliseconds)
      clock += milliseconds
    },
    fetch: async (_url, init) => {
      const request = {
        body: JSON.parse(String(init.body)),
        at: clock,
        headers: init.headers as Record<string, string>,
      }
      requests.push(request)
      const reply =
        typeof replies === 'function' ? replies(request) : replies.shift()
      if (!reply) throw new Error('unexpected request')
      if (reply instanceof Error) throw reply
      return reply
    },
  })
  return { client, requests, sleeps }
}
