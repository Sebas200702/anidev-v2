// Client JS budget check: prints per-chunk gzip sizes, compares the total
// against client-budget.json (fails past +5%), and refuses dedicated React
// runtime chunks (zero-island invariant from F.1).
// Usage: `bun scripts/client-budget.mjs` (runs on `bun run build` via CI).
import { readFileSync, readdirSync, existsSync } from 'node:fs'
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
  console.log(
    `${chunk.name} raw=${chunk.raw} gzip=${chunk.gzip}`
  )
}
console.log(`total gzip=${total}`)

const reactChunks = chunks.filter((chunk) => /react/i.test(chunk.name))
if (reactChunks.length > 0) {
  console.error(
    `React runtime chunks shipped: ${reactChunks.map((c) => c.name).join(', ')}`
  )
  process.exit(1)
}

if (!existsSync(budgetPath)) {
  console.log('no client-budget.json yet — writing baseline')
  const { writeFileSync } = await import('node:fs')
  writeFileSync(
    budgetPath,
    JSON.stringify({ totalGzip: total, chunks }, null, 2) + '\n'
  )
  process.exit(0)
}

const budget = JSON.parse(readFileSync(budgetPath, 'utf-8'))
if (total > budget.totalGzip * 1.05) {
  console.error(
    `client budget exceeded: gzip total ${total} > 105% of ${budget.totalGzip}`
  )
  process.exit(1)
}
console.log(
  `within budget (${total} <= ${Math.round(budget.totalGzip * 1.05)})`
)
