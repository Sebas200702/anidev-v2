/**
 * Fetches the full AniList cast of MAL anime ids into a resumable JSONL (cast relink T3).
 *
 * Usage:
 *   bun scripts/db/cast-relink/fetch-anilist.ts IDS_FILE --out OUT.jsonl
 *     [--map MAP.tsv] [--rpm 30]
 *
 * IDS_FILE holds one MAL anime id per line; MAP.tsv holds `mal_id<TAB>anilist_id` (both
 * from `run.sh fetch-list`). Lines are appended to OUT; ids already in OUT without an
 * `error` are skipped, so an interrupted run resumes and errored ids are retried.
 *
 * @module scripts/db/cast-relink/fetch-anilist
 */
import { appendFile, readFile } from 'node:fs/promises'
import { createAnilistClient, DEFAULT_RPM } from './anilist-client'

const USAGE =
  'usage: fetch-anilist.ts IDS_FILE --out OUT.jsonl [--map MAP.tsv] [--rpm N]'

const fail = (message: string): never => {
  process.stderr.write(`fetch-anilist: ${message}\n${USAGE}\n`)
  process.exit(1)
}

const parseArgs = (argv: string[]) => {
  const options: Record<string, string> = {}
  const positional: string[] = []
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg.startsWith('--')) {
      positional.push(arg)
      continue
    }
    const value = argv[index + 1]
    if (value == null) fail(`missing value for ${arg}`)
    options[arg.slice(2)] = value
    index += 1
  }
  return { idsFile: positional[0], options }
}

const readLines = async (path: string, isOptional = false) => {
  const text = await readFile(path, 'utf8').catch(
    (error: NodeJS.ErrnoException) => {
      if (isOptional && error.code === 'ENOENT') return ''
      return fail(`cannot read ${path}: ${error.message}`)
    }
  )
  return text.split('\n').filter((line) => line.trim() !== '')
}

const toId = (value: string | undefined) => {
  const id = Number(value?.trim())
  return Number.isInteger(id) && id > 0 ? id : undefined
}

const { idsFile, options } = parseArgs(process.argv.slice(2))
const outFile = options.out
if (!idsFile || !outFile) fail('IDS_FILE and --out are required')
const rpm = Number(options.rpm ?? DEFAULT_RPM)
if (!(rpm > 0)) fail('--rpm must be a positive number')

const ids = [...new Set((await readLines(idsFile)).map(toId))].filter(
  (id): id is number => id != null
)
const anilistIds = new Map<number, number>()
for (const line of options.map ? await readLines(options.map) : []) {
  const [malId, anilistId] = line.split('\t').map(toId)
  if (malId != null && anilistId != null) anilistIds.set(malId, anilistId)
}
const done = new Set<number>()
for (const line of await readLines(outFile, true)) {
  try {
    const parsed = JSON.parse(line) as { anime_id?: number; error?: string }
    if (parsed.anime_id != null && parsed.error == null)
      done.add(parsed.anime_id)
  } catch {
    // a line cut by an interrupted append is fetched again
  }
}

const pending = ids.filter((id) => !done.has(id))
process.stderr.write(
  `fetch-anilist: ${ids.length} ids, ${ids.length - pending.length} done, ${pending.length} to fetch at ≤${rpm} req/min\n`
)
const client = createAnilistClient({
  fetch: (url, init) => fetch(url, init),
  sleep: (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
  now: () => Date.now(),
  rpm,
})
const counts = { found: 0, missing: 0, errors: 0 }
for (const [index, malId] of pending.entries()) {
  const line = await client.fetchCast(malId, anilistIds.get(malId))
  await appendFile(outFile, `${JSON.stringify(line)}\n`)
  if (line.error) counts.errors += 1
  else if (line.found) counts.found += 1
  else counts.missing += 1
  if ((index + 1) % 25 === 0 || index + 1 === pending.length) {
    process.stderr.write(
      `fetch-anilist: ${index + 1}/${pending.length} found=${counts.found} missing=${counts.missing} errors=${counts.errors}\n`
    )
  }
}
