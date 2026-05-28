/**
 * @module lib/db/schemas/character-relations
 *
 * Relationship tables connecting characters to staff voice actors by language.
 * Supports multilingual casting credits for the same character.
 *
 * @remarks
 * Composite primary key `(characterId, staffId, language)` allows one staff
 * member to voice the same character in multiple languages as separate rows.
 * Both FKs cascade on parent delete.
 *
 * @see {@link module:lib/db/schemas/character} for character root
 * @see {@link module:lib/db/schemas/staff} for staff/voice actor profiles
 */
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { character } from '@db/schemas/character'
import { staff } from '@db/schemas/staff'

/**
 * Voice casting link (`character_voice_actor` table) between character and staff.
 *
 * **Key columns:**
 * - `characterId` — FK to {@link character.malId}.
 * - `staffId` — FK to {@link staff.malId} (voice actor).
 * - `language` — Dub language label (Japanese, English, etc.); part of PK.
 */
export const characterVoiceActor = sqliteTable(
  'character_voice_actor',
  {
    characterId: integer('character_id')
      .notNull()
      .references(() => character.malId, { onDelete: 'cascade' }),
    staffId: integer('staff_id')
      .notNull()
      .references(() => staff.malId, { onDelete: 'cascade' }),
    language: text('language').notNull(),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.staffId, t.language] })]
)
