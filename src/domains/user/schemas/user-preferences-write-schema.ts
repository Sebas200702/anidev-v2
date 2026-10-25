/**
 * Request schema for `PATCH /api/user/:userId/preferences`.
 *
 * @module domains/user/schemas/user-preferences-write-schema
 */
import { z } from 'zod'
import {
  FANATIC_LEVELS,
  MAX_FAVORITES_PER_LIST,
  PREFERRED_FORMATS,
  WATCH_FREQUENCIES,
} from '@user/constants'

/** Unique positive MAL ids, at most {@link MAX_FAVORITES_PER_LIST}. */
const malIdList = z
  .array(z.number().int().positive())
  .max(MAX_FAVORITES_PER_LIST)
  .transform((ids) => [...new Set(ids)])

/**
 * Non-empty, strict partial of the taste profile.
 *
 * @remarks
 * | Field | Rule |
 * |-------|------|
 * | `fanaticLevel` | `low \| medium \| high` |
 * | `frequency` | `daily \| weekly \| monthly` |
 * | `preferredFormat` | `tv \| movie \| ova \| ona \| special \| music` |
 * | `favoriteGenres` / `favoriteStudios` / `favoriteAnimes` | unique positive MAL ids, ≤ 50; `[]` clears |
 */
export const preferencesUpdateSchema = z
  .strictObject({
    fanaticLevel: z.enum(FANATIC_LEVELS),
    frequency: z.enum(WATCH_FREQUENCIES),
    preferredFormat: z.enum(PREFERRED_FORMATS),
    favoriteGenres: malIdList,
    favoriteStudios: malIdList,
    favoriteAnimes: malIdList,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one preference field is required',
  })

/** **Request schema** — `{ params: { userId }, body }`. */
export const updateUserPreferencesSchema = z.strictObject({
  params: z.strictObject({ userId: z.coerce.string() }),
  body: preferencesUpdateSchema,
  query: z.strictObject({}).optional().default({}),
})

/** Validated preferences patch. */
export type PreferencesUpdate = z.infer<typeof preferencesUpdateSchema>
