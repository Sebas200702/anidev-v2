/**
 * Serialization helpers for the standard JSON API response envelope.
 *
 * @module shared/http/api-response-serialize-util
 * @remarks
 * Turns an {@link ApiEnvelope} into an HTTP {@link Response} and merges auxiliary headers (e.g.
 * Better Auth `Set-Cookie`). Envelope builders live in {@link create-api-response-util}.
 */
import type { ApiEnvelope } from './api-envelope'

/**
 * Serializes an API envelope into a JSON {@link Response}.
 *
 * @param payload - Envelope to stringify
 * @param initHeaders - Optional headers merged into the response (plain object or `Headers`)
 * @param statusOverride - Optional HTTP status override; defaults to `payload.status`
 * @returns `Response` with `Content-Type: application/json` and body `JSON.stringify(payload)`
 *
 * @remarks
 * When `initHeaders` is a `Headers` instance, entries are copied into a plain object before merge.
 *
 * @see {@link withErrorHandling}
 */
export function jsonResponse(
  payload: ApiEnvelope<unknown>,
  initHeaders?: HeadersInit,
  statusOverride?: number
) {
  const status = statusOverride ?? payload.status

  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(initHeaders instanceof Headers
        ? Object.fromEntries(initHeaders.entries())
        : initHeaders),
    },
  })
}

/**
 * Appends headers from a secondary source onto a response header collection.
 *
 * @param responseHeaders - Mutable `Headers` on the outgoing `Response`
 * @param authHeaders - Optional headers to append (e.g. `Set-Cookie` from Better Auth)
 * @returns The same `responseHeaders` instance for chaining
 *
 * @remarks
 * No-op when `authHeaders` is undefined. Uses `append` so multiple `Set-Cookie` values are preserved.
 *
 * @see {@link withErrorHandling}
 */
export function mergeResponseHeaders(
  responseHeaders: Headers,
  authHeaders?: Headers
) {
  if (!authHeaders) {
    return responseHeaders
  }

  authHeaders.forEach((value, key) => {
    responseHeaders.append(key, value)
  })

  return responseHeaders
}
