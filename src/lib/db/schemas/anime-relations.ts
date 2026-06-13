/**
 * @module lib/db/schemas/anime-relations
 *
 * Aggregating re-export for anime junction/association tables. The table definitions are split by
 * concern into {@link module:lib/db/schemas/anime-taxonomy-relations} (genre/theme/demographic) and
 * {@link module:lib/db/schemas/anime-entity-relations} (staff/music/character/related/producer);
 * this module re-exports all of them so `@db/schemas/anime-relations` stays the single import point.
 *
 * @remarks
 * Most junction tables cascade-delete when parent anime or related entity is removed. Composite
 * keys prevent duplicate links while allowing multiple roles where applicable.
 *
 * @see {@link module:lib/db/schemas/anime} for anime root entity
 * @see {@link module:lib/db/schemas/anime-taxonomy} for genre/theme/demographic lookups
 * @see {@link module:lib/db/schemas/character} for character entities
 * @see {@link module:lib/db/schemas/staff} for staff entities
 */
export * from '@db/schemas/anime-taxonomy-relations'
export * from '@db/schemas/anime-entity-relations'
