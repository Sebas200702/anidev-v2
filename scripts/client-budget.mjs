// Client JS budget check: prints per-chunk gzip sizes, refuses dedicated React
// runtime chunks (zero-island invariant from F.1), and enforces an absolute
// gzip ceiling. Totals legitimately vary by build environment (see
// client-budget.json notes: DSN presence ±45KB, unstable chunk hashes), so the
// committed baseline is for human comparison only — the gate fails on the two
// stable invariants, never on exact-total matching.
// Usage: `bun scripts/client-budget.mjs` (runs in the CI `gate` job).
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const dir = join(process.cwd(), 'dist', 'client', '_astro')
const budgetPath = join(process.cwd(), 'client-budget.json')

const chunks = readdirSync(dir)
  .filter((name) => name.endsWith('.js'))
  .map((name) => {
    const raw = readFileSync(join(dir, name))
    return { name, raw: raw.length, gzip: gzipSync(raw).length }
  })
  .sort((a, b) => b.gzip - a.gzip)

const total = chunks.reduce((sum, chunk) => sum + chunk.gzip, 0)
for (const chunk of chunks) {
  console.log(`chunk ${chunk.name} raw=${chunk.raw} gzip=${chunk.gzip}`)
}
console.log(`total gzip=${total}`)

const reactChunks = chunks.filter((chunk) => /react/i.test(chunk.name))
if (reactChunks.length > 0) {
  console.error(
    `React runtime chunks shipped: ${reactChunks.map((c) => c.name).join(', ')}`
  )
  process.exit(1)
}

const budget = existsSync(budgetPath)
  ? JSON.parse(readFileSync(budgetPath, 'utf-8'))
  : null
const ceiling = budget?.maxTotalGzip ?? 150000
if (budget?.baseline) {
  console.log(
    `baseline total=${budget.baseline.totalGzip} (reference only, see notes)`
  )
}
if (total > ceiling) {
  console.error(`client budget exceeded: gzip total ${total} > ${ceiling}`)
  process.exit(1)
}
console.log(`within budget (total ${total} <= ceiling ${ceiling})`)
