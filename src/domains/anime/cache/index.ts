/**
 * Public exports for anime domain cache modules.
 *
 * @module domains/anime/cache
 * @remarks
 * Redis read-through helpers keyed by MAL ID or filter JSON. Each cache pairs
 * with a service in `domains/anime/services`.
 *
 * | Export | Key prefix | TTL | Service |
 * |--------|------------|-----|---------|
 * | `animeDetailsCache` | `anime:details` | Medium | `animeService` |
 * | `animeFullCache` | `anime:full` | Medium | `animeFullService` |
 * | `animeListCache` | `anime:list` | Medium | `animeListService` |
 * | `animeCharacterCache` | `anime:characters` | Long | `animeCharacterService` |
 * | `animeStaffCache` | `anime:staff` | Long | `animeStaffService` |
 */

export { animeDetailsCache } from './anime-cache'
export { animeCharacterCache } from './anime-character-cache'
export { animeFullCache } from './anime-full-cache'
export { animeListCache } from './anime-list-cache'
export { animeStaffCache } from './anime-staff-cache'
