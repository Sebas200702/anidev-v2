/**
 * Deterministic JSON serialization for cache keys.
 *
 * @module lib/cache/stable-stringify
 * @remarks
 * Plain `JSON.stringify` preserves insertion order, so two equivalent filter
 * objects built in different field orders produce different cache keys and
 * never hit. Only normalized filter shapes may enter cache keys; this
 * serializer additionally sorts object keys recursively so field order is
 * irrelevant. Array order is significant and preserved.
 *
 * @see {@link animeListCache.key} and {@link musicListCache.key} for consumers
 * @example
 * ```typescript
 * stableStringify({ limit: 10, page: 1 }) === stableStringify({ page: 1, limit: 10 })
 * // true
 * ```
 */

/**
 * Recursively sorts object keys for deterministic serialization.
 *
 * @param value - Any JSON-compatible value
 * @returns The value with every object's keys in ascending order
 */
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(record)
        // Codepoint order, not locale order: deterministic on every machine.
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
        .map((key) => [key, canonicalize(record[key])])
    )
  }
  return value
}

/**
 * Serializes a value with recursively sorted object keys.
 *
 * @param value - JSON-compatible value (normalized cache-key input)
 * @returns Deterministic JSON string; `undefined` handling matches `JSON.stringify`
 */
export const stableStringify = (value: unknown): string =>
  JSON.stringify(canonicalize(value))
