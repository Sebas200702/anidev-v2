/**
 * One-off dev utility: inspects and flushes Dragonfly keys.
 *
 * Usage:
 *   bun scripts/cache-inspect.ts           → list counts per namespace
 *   bun scripts/cache-inspect.ts --flush   → delete every key
 *
 * @remarks Dev-only. Safe because the local Dragonfly (`REDIS_URL`,
 * docker compose) holds only cache data — nothing persistent lives here.
 */
import { Redis } from 'ioredis'
import { config } from '../src/config/index'

const isFlush = process.argv.includes('--flush')
const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')

const cursorAll = async () => {
  const keys: string[] = []
  let cursor = '0'
  do {
    const [next, batch] = await redis.scan(cursor, 'COUNT', 500)
    cursor = next
    keys.push(...batch)
  } while (cursor !== '0')
  return keys
}

const keys = await cursorAll()
const originSuffix = `|${config.baseUrl}`
const byOrigin = keys.filter((key) => key.endsWith(originSuffix))
const other = keys.filter((key) => !key.endsWith(originSuffix))

console.log(`total: ${keys.length}`)
console.log(`origin (${config.baseUrl}): ${byOrigin.length}`)
console.log(`other namespaced-or-legacy keys: ${other.length}`)
for (const key of other.slice(0, 10)) console.log(`  other → ${key}`)

if (isFlush) {
  if (keys.length > 0) await redis.del(...keys)
  console.log(`flushed: ${keys.length}`)
}

redis.disconnect()
