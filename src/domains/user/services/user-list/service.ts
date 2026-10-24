/**
 * Service for the relational user anime list.
 *
 * @module domains/user/services/user-list/service
 */
import { userListRepository } from '@user/repositories/user-list'
import { mapUserList, mapUserListEntry } from '@user/mappers/user-list'
import type { UserListEntry } from '@user/schemas/user-list-schema'

export const userListService = {
  async list(
    userId: string,
    filters: { status?: string; isFavorite?: boolean } = {}
  ) {
    const rows = await userListRepository.getUserList(userId, filters)
    return mapUserList(rows)
  },

  async upsert(userId: string, entry: UserListEntry) {
    const row = await userListRepository.upsertUserList(userId, entry)
    return mapUserListEntry(row)
  },

  async remove(userId: string, animeId: number) {
    const snapshot = await userListRepository.deleteUserList(userId, animeId)
    return snapshot ? mapUserListEntry(snapshot) : null
  },
}
