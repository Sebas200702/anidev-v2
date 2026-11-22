/**
 * Offline checks of `--type MANGA` (catalog rebuild T2): the single and batched queries
 * ask `Media(..., type: MANGA)`, and the CLI rejects an unknown type before any request.
 * Run: bun test scripts/db/cast-relink/test
 *
 * @module scripts/db/cast-relink/test/anilist-manga.test
 */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { aliasesOf, catalog, run, typesOf } from './batch-catalog'
import { harness, page } from './harness'

test('fetchCast pages a manga cast with type MANGA', async () => {
  const { client, requests } = harness(
    [page([1], true), page([2], false)],
    30,
    'MANGA'
  )
  const line = await client.fetchCast(2, 30002)
  assert.equal(line.found, true)
  assert.equal(line.edges.length, 2)
  assert.match(requests[0].body.query, /Media\(id: \$id, type: MANGA\)/)
  assert.doesNotMatch(requests[0].body.query, /ANIME/)
  assert.deepEqual(requests[1].body.variables, { id: 30002, page: 2 })
})

test('fetchCasts packs aliased MANGA lookups', async () => {
  const { client, requests } = harness(
    catalog({ 11: [[1]], 9012: [[2]] }),
    30,
    'MANGA'
  )
  const lines = await run(client, [11, 12], 20, { 12: 9012 })
  assert.deepEqual(aliasesOf(requests[0]), [
    { alias: 'a0', key: 'idMal', id: 11, page: 1 },
    { alias: 'a1', key: 'id', id: 9012, page: 1 },
  ])
  assert.deepEqual(typesOf(requests[0]), ['MANGA', 'MANGA'])
  assert.deepEqual(
    lines.map((line) => [line.anime_id, line.found]),
    [
      [11, true],
      [12, true],
    ]
  )
})

test('the default type stays ANIME', async () => {
  const { client, requests } = harness(catalog({ 1: [[1]] }))
  await run(client, [1], 10)
  assert.deepEqual(typesOf(requests[0]), ['ANIME'])
})

test('the CLI rejects an unknown --type with exit 1', () => {
  const script = fileURLToPath(new URL('../fetch-anilist.ts', import.meta.url))
  const result = spawnSync(
    process.execPath,
    [script, 'ids.txt', '--out', 'out.jsonl', '--type', 'BOOK'],
    { encoding: 'utf8' }
  )
  assert.equal(result.status, 1)
  assert.match(result.stderr, /--type must be ANIME or MANGA/)
  assert.equal(result.stdout, '')
})
