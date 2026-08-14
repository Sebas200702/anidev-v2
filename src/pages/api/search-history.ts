/**
 * Per-user search-history API endpoint (cross-domain).
 *
 * @module pages/api/search-history
 *
 * **Route:** `GET /api/search-history`, `DELETE /api/search-history`
 *
 * **Authentication:** session-required and owner-scoped — both verbs act only on
 * the authenticated caller's own history. Not in the public allowlist, so the
 * auth middleware nulls locals for anonymous callers and {@link requireAuthSession}
 * rejects them with `401 AUTH_REQUIRED`.
 *
 * Search history is transversal (anime today, music/characters/… later), so it
 * lives outside the `anime` route tree and is keyed by a `scope` discriminator.
 *
 * @see {@link getSearchHistorySchema} — read request validation
 * @see {@link deleteSearchHistorySchema} — clear request validation
 * @see {@link searchHistoryService} — owner-scoped history service
 * @see {@link requireAuthSession} — auth gate
 */

import type { APIContext, APIRoute } from 'astro'
import { withZodValidation } from '@http/with-validation'
import { withErrorHandling } from '@http/with-error-handling'
import {
  getSearchHistorySchema,
  deleteSearchHistorySchema,
  searchHistoryListResponseSchema,
  searchHistoryClearResponseSchema,
} from '@search/schemas'
import { searchHistoryService } from '@search/services/search-history'
import { SEARCH_HISTORY_CACHE_CONTROL } from '@search/constants'
import { requireAuthSession } from '@auth/utils'

/**
 * Returns the caller's recent searches, newest first.
 *
 * @remarks
 * **Request**
 *
 * | Source | Field | Type | Required | Default | Description |
 * |--------|-------|------|----------|---------|-------------|
 * | Query | `limit` | `number` | No | `20` | Max entries (1–100) |
 *
 * **Success — `200 OK`:** `{ data: SearchHistoryEntry[], status: 200, meta: { count } }`
 *
 * **Error responses** (envelope `{ data: null, status, error, code, meta }`)
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 400 | `VALIDATION_ERROR` | `limit` fails {@link getSearchHistorySchema} |
 * | 401 | `AUTH_REQUIRED` | No session user present |
 * | 500 | `DB_ERROR` | History read failed |
 * | 500 | `RESPONSE_VALIDATION_ERROR` | Response envelope fails its Zod schema (wrapper-level) |
 *
 * @example
 * ```bash
 * curl "http://localhost:4321/api/search-history?limit=10" -b cookies.txt
 * ```
 */
export const GET: APIRoute = withZodValidation(getSearchHistorySchema)(
  withErrorHandling(
    async ({
      locals,
      validated,
    }: APIContext & { validated: { query: { limit: number } } }) => {
      const userId = requireAuthSession(locals)
      const rows = await searchHistoryService.list(
        userId,
        validated.query.limit
      )
      const entries = rows.map((row) => ({
        id: row.id,
        scope: row.scope,
        query: row.query,
        filters: row.filters,
        createdAt: row.createdAt,
      }))

      return {
        data: entries,
        status: 200,
        meta: { count: entries.length },
        headers: new Headers({ 'Cache-Control': SEARCH_HISTORY_CACHE_CONTROL }),
      }
    },
    { responseSchema: searchHistoryListResponseSchema }
  )
)

/**
 * Clears the caller's entire search history.
 *
 * @remarks
 * **Success — `200 OK`:** `{ data: { removed: number }, status: 200, meta: {} }`
 *
 * **Error responses** (envelope `{ data: null, status, error, code, meta }`)
 *
 * | Status | Code | When |
 * |--------|------|------|
 * | 401 | `AUTH_REQUIRED` | No session user present |
 * | 500 | `DB_ERROR` | History delete failed |
 * | 500 | `RESPONSE_VALIDATION_ERROR` | Response envelope fails its Zod schema (wrapper-level) |
 *
 * @example
 * ```bash
 * curl -X DELETE "http://localhost:4321/api/search-history" -b cookies.txt
 * ```
 */
export const DELETE: APIRoute = withZodValidation(deleteSearchHistorySchema)(
  withErrorHandling(
    async ({ locals }: APIContext) => {
      const userId = requireAuthSession(locals)
      const removed = await searchHistoryService.clear(userId)

      return {
        data: { removed },
        status: 200,
        meta: {},
        headers: new Headers({ 'Cache-Control': SEARCH_HISTORY_CACHE_CONTROL }),
      }
    },
    { responseSchema: searchHistoryClearResponseSchema }
  )
)
