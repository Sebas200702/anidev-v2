/**
 * Zod schemas for the extended printed-media payload (`/api/manga/:malId/full`).
 *
 * @module domains/manga/schemas/manga-full-schema
 */
import { z } from 'zod'
import { createApiResponseSchema } from '@shared/schemas/api-schema'
import { mangaDetailsSchema } from './manga-details-schema'

/** A taxonomy entry with its MAL id, so clients can link to the facet. */
const taxonomyEntrySchema = z.object({ malId: z.number(), name: z.string() })

/**
 * Validates the extended printed-media payload.
 *
 * @remarks
 * Same base as {@link mangaDetailsSchema}, but nested: taxonomy as
 * `{ malId, name }` objects, every title (main, english, japanese, synonyms)
 * in `titles`, and related works grouped by relation type.
 */
export const mangaFullDetailsSchema = mangaDetailsSchema
  .omit({ genres: true, themes: true, demographics: true, related: true })
  .extend({
    titles: z.array(
      z.object({
        title: z.string(),
        type: z.enum(['main', 'english', 'japanese', 'synonym']),
      })
    ),
    genres: z.array(taxonomyEntrySchema),
    themes: z.array(taxonomyEntrySchema),
    demographics: z.array(taxonomyEntrySchema),
    relations: z.array(
      z.object({
        relation: z.string(),
        entry: z.array(
          z.object({ mangaId: z.number(), title: z.string(), url: z.url() })
        ),
      })
    ),
  })

/** **Response schema** — `{ data: MangaFullDetails }` envelope. */
export const mangaFullDetailsResponseSchema = createApiResponseSchema(
  mangaFullDetailsSchema
)
