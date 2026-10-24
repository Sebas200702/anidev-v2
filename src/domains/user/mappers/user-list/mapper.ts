/**
 * Mapper for the relational user anime list.
 *
 * @module domains/user/mappers/user-list/mapper
 */
import type { UserListRow } from '@user/repositories/user-list'

export interface UserListApiEntry {
  animeId: number
  status: string
  isFavorite: boolean
  score: number | null
  addedAt: string
  updatedAt: string
}

export const mapUserListEntry = (row: UserListRow): UserListApiEntry => ({
  animeId: row.animeId,
  status: row.status,
  isFavorite: row.isFavorite,
  score: row.score,
  addedAt: row.addedAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

export const mapUserList = (rows: UserListRow[]): UserListApiEntry[] =>
  rows.map(mapUserListEntry)
