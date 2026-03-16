import { db } from '@/core/db/client'
import { dbError } from '@/core/errors/db-errors'
import { staff } from '@/core/db/schemas/staff'
import { staffMedia } from '@/core/db/schemas/staff-media'
import { inArray } from 'drizzle-orm'
export const staffRepository = {
  async getManyByMalIds(ids: number[]) {
    try {
      if (!ids.length) return []

      return db.select().from(staff).where(inArray(staff.malId, ids))
    } catch (error) {
      throw dbError('[GET_MANY_BY_MAL_IDS]', { ids }, error)
    }
  },
  async getMediaByStaffIds(ids: number[]) {
    try {
      if (!ids.length) return []

      return db
        .select()
        .from(staffMedia)
        .where(inArray(staffMedia.staffId, ids))
    } catch (error) {
      throw dbError('[GET_MEDIA_BY_STAFF_IDS]', { ids }, error)
    }
  },
}
