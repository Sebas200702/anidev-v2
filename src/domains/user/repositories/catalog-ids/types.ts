/**
 * Types of the catalog id existence repository.
 *
 * @module domains/user/repositories/catalog-ids/types
 */

/** MAL id lists to check, per catalog table. */
export interface CatalogIdLists {
  genres?: number[]
  studios?: number[]
  animes?: number[]
}
