/**
 * @module lib/db/schemas/staff-media
 *
 * Portrait and related media assets for staff profiles. Uses the shared
 * `mediaType` / `src` / `size` column pattern for consistent repository mapping.
 *
 * @remarks
 * Cascade-deletes with parent staff row. Multiple images per person support
 * thumbnails and full-resolution portraits.
 *
 * @see {@link module:lib/db/schemas/staff} for parent staff entity
 */
import { index, integer, pgTable, serial, text } from 'drizzle-orm/pg-core'
import { staff } from '@db/schemas/staff'

/**
 * Portrait and media URLs (`staff_media` table) associated with a staff member.
 *
 * **Key columns:**
 * - `staffId` — FK to {@link staff.malId}; cascade on delete.
 * - `mediaType` — Asset type (image, etc.).
 * - `src` — URL or path to media.
 * - `size` — Optional size variant.
 */
export const staffMedia = pgTable(
  'staff_media',
  {
    id: serial('id').primaryKey(),
    staffId: integer('staff_id')
      .notNull()
      .references(() => staff.malId, { onDelete: 'cascade' }),
    mediaType: text('media_type').notNull(),
    src: text('src').notNull(),
    size: text('size'),
  },
  (t) => [index('staff_media_staff_id_type_idx').on(t.staffId, t.mediaType)]
)
