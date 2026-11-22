/**
 * Offline checks of the AniList cast client: pagination, throttle and retry rules.
 * Run: bun test scripts/db/cast-relink/test
 *
 * @module scripts/db/cast-relink/test/anilist-client.test
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { harness, page } from './harness'

test('paginates until hasNextPage is false and keeps every edge', async () => {
  const { client, requests } = harness([
    page([1, 2], true),
    page([3], true),
    page([4], false),
  ])
  const line = await client.fetchCast(21)
  assert.deepEqual(
    line.edges.map((edge) => (edge as { node: { id: number } }).node.id),
    [1, 2, 3, 4]
  )
  assert.equal(line.found, true)
  assert.equal(line.error, undefined)
  assert.deepEqual(
    requests.map((request) => request.body.variables),
    [
      { id: 21, page: 1 },
      { id: 21, page: 2 },
      { id: 21, page: 3 },
    ]
  )
  assert.match(requests[0].body.query, /Media\(idMal: \$id, type: ANIME\)/)
  assert.deepEqual(requests[0].headers['user-agent'], 'cast-relink/1.0')
})

test('queries by AniList id when the map supplies one', async () => {
  const { client, requests } = harness([page([1], false)])
  await client.fetchCast(21, 9021)
  assert.equal(requests[0].body.variables.id, 9021)
  assert.match(requests[0].body.query, /Media\(id: \$id, type: ANIME\)/)
})

test('throttles to the requested requests per minute', async () => {
  const { client, requests } = harness(
    [page([1], false), page([2], false), page([3], false)],
    30
  )
  await client.fetchCast(1)
  await client.fetchCast(2)
  await client.fetchCast(3)
  assert.deepEqual(
    requests.map((request) => request.at),
    [0, 2000, 4000]
  )
})

test('a 404 is recorded as not found without an error', async () => {
  const { client } = harness([
    Response.json({ data: { Media: null } }, { status: 404 }),
  ])
  assert.deepEqual(await client.fetchCast(5), {
    anime_id: 5,
    found: false,
    edges: [],
  })
})

test('honors Retry-After on 429 and then succeeds', async () => {
  const limited = new Response('', {
    status: 429,
    headers: { 'retry-after': '7' },
  })
  const { client, sleeps } = harness([limited, page([1], false)])
  const line = await client.fetchCast(5)
  assert.equal(line.found, true)
  assert.ok(sleeps.includes(8000), `waited Retry-After + 1s, sleeps: ${sleeps}`)
})

test('retries 5xx and network errors 3 times, then records the error', async () => {
  const server = () => new Response('', { status: 502 })
  const { client, requests } = harness([
    new Error('reset'),
    server(),
    server(),
    server(),
  ])
  const line = await client.fetchCast(5)
  assert.deepEqual(line, {
    anime_id: 5,
    found: false,
    edges: [],
    error: 'HTTP 502',
  })
  assert.equal(requests.length, 4)
})

test('a recovered 5xx keeps the pages already fetched', async () => {
  const { client } = harness([
    page([1], true),
    new Response('', { status: 500 }),
    page([2], false),
  ])
  const line = await client.fetchCast(5)
  assert.equal(line.found, true)
  assert.equal(line.edges.length, 2)
})
