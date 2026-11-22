/**
 * Offline checks of the batched AniList cast fetch: aliases per request, multi-page
 * continuation, per-alias not-found/error and the complexity back-off.
 * Run: bun test scripts/db/cast-relink/test
 *
 * @module scripts/db/cast-relink/test/anilist-batch.test
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { aliasesOf, catalog, run } from './batch-catalog'
import { harness } from './harness'

test('packs up to N aliased lookups per request', async () => {
  const casts = { 1: [[11]], 2: [[12]], 3: [[13]], 4: [[14]], 5: [[15]] }
  const { client, requests } = harness(catalog({ ...casts, 9003: [[13]] }))
  const lines = await run(client, [1, 2, 3, 4, 5], 2, { 3: 9003 })
  assert.deepEqual(
    requests.map((request) => aliasesOf(request).length),
    [2, 2, 1]
  )
  assert.deepEqual(aliasesOf(requests[1])[0], {
    alias: 'a0',
    key: 'id',
    id: 9003,
    page: 1,
  })
  assert.equal(aliasesOf(requests[0])[0].key, 'idMal')
  assert.deepEqual(
    lines.map((line) => [line.anime_id, line.found, line.edges.length]),
    [1, 2, 3, 4, 5].map((id) => [id, true, 1])
  )
  assert.deepEqual(
    requests.map((request) => request.at),
    [0, 2000, 4000]
  )
})

test('continues multi-page animes in later batches and writes them once', async () => {
  const casts = { 1: [[1, 2], [3], [4]], 2: [[20]], 3: [[30]], 4: [[40]] }
  const { client, requests } = harness(catalog(casts))
  const lines = await run(client, [1, 2, 3, 4], 2)
  assert.deepEqual(
    requests.map((request) =>
      aliasesOf(request).map(({ id, page }) => `${id}p${page}`)
    ),
    [
      ['1p1', '2p1'],
      ['1p2', '3p1'],
      ['1p3', '4p1'],
    ]
  )
  assert.deepEqual(
    lines.map((line) => line.anime_id),
    [2, 3, 1, 4]
  )
  const first = lines.find((line) => line.anime_id === 1)
  assert.deepEqual(first, {
    anime_id: 1,
    found: true,
    edges: [1, 2, 3, 4].map((cid) => ({ role: 'MAIN', node: { cid } })),
  })
})

test('a null alias or a Not Found alias error is found:false without error', async () => {
  const notFound = { error: { message: 'Not Found.', status: 404 } }
  const { client } = harness(
    catalog({ 1: [[11]] }, (_alias, id) => (id === 3 ? notFound : undefined))
  )
  const lines = await run(client, [1, 2, 3], 3)
  assert.deepEqual(lines, [
    { anime_id: 1, found: true, edges: [{ role: 'MAIN', node: { cid: 11 } }] },
    { anime_id: 2, found: false, edges: [] },
    { anime_id: 3, found: false, edges: [] },
  ])
})

test('an alias error is retried, then recorded as that anime error', async () => {
  const broken = { error: { message: 'Internal Server Error', status: 500 } }
  const { client, requests } = harness(
    catalog({ 1: [[11]], 2: [[12]], 3: [[13]] }, (_alias, id) =>
      id === 2 ? broken : undefined
    )
  )
  const lines = await run(client, [1, 2, 3], 2)
  const tries = requests.filter((request) =>
    aliasesOf(request).some(({ id }) => id === 2)
  )
  assert.equal(tries.length, 4)
  assert.deepEqual(
    lines.find((line) => line.anime_id === 2),
    {
      anime_id: 2,
      found: false,
      edges: [],
      error: 'HTTP 200: Internal Server Error',
    }
  )
  assert.equal(lines.filter((line) => line.found).length, 2)
})

test('a complexity error halves the batch size and retries the same lookups', async () => {
  const casts = { 1: [[11]], 2: [[12]], 3: [[13]], 4: [[14]] }
  const answer = catalog(casts)
  const { client, requests } = harness((request) =>
    aliasesOf(request).length > 2
      ? Response.json(
          { errors: [{ message: 'Max query complexity', status: 400 }] },
          { status: 400 }
        )
      : answer(request)
  )
  const lines = await run(client, [1, 2, 3, 4], 4)
  assert.deepEqual(
    requests.map((request) => aliasesOf(request).length),
    [4, 2, 2]
  )
  assert.deepEqual(lines.map((line) => [line.anime_id, line.found]).sort(), [
    [1, true],
    [2, true],
    [3, true],
    [4, true],
  ])
})

test('a request failing after the 5xx retries marks every anime of the batch', async () => {
  const server = () => new Response('', { status: 503 })
  const { client, requests } = harness([server(), server(), server(), server()])
  const lines = await run(client, [1, 2], 2)
  assert.equal(requests.length, 4)
  assert.deepEqual(
    lines,
    [1, 2].map((id) => ({
      anime_id: id,
      found: false,
      edges: [],
      error: 'HTTP 503',
    }))
  )
})
