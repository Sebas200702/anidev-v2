import { db } from '@/core/db/client'
import { dbError } from '@/core/errors/db-errors'
import { staff } from '@/core/db/schemas/staff'
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
}
