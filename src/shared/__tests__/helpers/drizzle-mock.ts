/**
 * Test helper: a chainable Drizzle query-builder stub.
 *
 * @module shared/__tests__/helpers/drizzle-mock
 * @remarks
 * Repositories build queries as `db.select().from().where()...` and `await` the result. This
 * returns a thenable proxy whose every method returns itself, so any chain length resolves to the
 * configured value. Not a test file (no `.test` suffix) — imported by repository tests.
 */

/**
 * Builds a chainable thenable that resolves to `value` regardless of the chain of methods called.
 *
 * @param value - The value the awaited chain resolves to (usually a rows array)
 */
export const chainResolving = <T>(value: T): T => {
  const proxy: unknown = new Proxy(() => {}, {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (v: T) => void, reject: (e: unknown) => void) =>
          Promise.resolve(value).then(resolve, reject)
      }
      if (prop === 'catch') {
        return (reject: (e: unknown) => void) =>
          Promise.resolve(value).catch(reject)
      }
      if (prop === 'finally') {
        return (cb: () => void) => Promise.resolve(value).finally(cb)
      }
      return () => proxy
    },
    apply() {
      return proxy
    },
  })
  return proxy as T
}

/** Throws synchronously — use as a query-builder entry mock to hit repository `catch` blocks. */
export const throwOnQuery = () => {
  throw new Error('db connection failed')
}
