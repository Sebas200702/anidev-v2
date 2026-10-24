/**
 * Image URLs of the people domain entities and works.
 *
 * @module domains/people/mappers/media/mapper
 */
import { buildMediaUrl } from '@media/mappers/media-url'
import type { PeopleMedium } from '@people/types'

/** Portrait of a character. */
export const characterImageUrl = (malId: number) =>
  buildMediaUrl({
    entity: 'character',
    type: 'poster',
    size: 'small',
    entity_id: malId,
  })

/** Portrait of a person. */
export const personImageUrl = (malId: number) =>
  buildMediaUrl({
    entity: 'staff',
    type: 'poster',
    size: 'small',
    entity_id: malId,
  })

/** Poster (anime) or cover (manga) of a work, as the catalog cards use them. */
export const workImageUrl = (medium: PeopleMedium, malId: number) =>
  medium === 'anime'
    ? buildMediaUrl({
        entity: 'anime',
        type: 'poster',
        size: 'large',
        source: 'myanimelist',
        entity_id: malId,
      })
    : buildMediaUrl({
        entity: 'manga',
        type: 'cover',
        size: 'small',
        entity_id: malId,
      })
