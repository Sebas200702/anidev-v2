/**
 * Mappers for the printed-media (manga) domain.
 *
 * @module domains/manga/mappers
 */
import { config } from '@/config'
import { normalizeString } from '@utils/string/normalize-string-util'
import { buildMediaUrl } from '@media/mappers/media-url'
import type { MangaCard, MangaDB, MangaDetails } from '@manga/types'

/**
 * Maps a work row into its compact card payload.
 *
 * @param work - The `manga` row
 * @returns Public card DTO with CDN URLs
 */
export const mapMangaCard = (work: MangaDB): MangaCard => {
  const imageUrl = buildMediaUrl({
    entity: 'manga',
    type: 'cover',
    size: 'large',
    entity_id: work.malId,
  })
  const smallImageUrl = buildMediaUrl({
    entity: 'manga',
    type: 'cover',
    size: 'small',
    entity_id: work.malId,
  })
  return {
    malId: work.malId,
    title: work.title,
    type: work.type,
    year: work.year ?? 0,
    status: work.status ?? 'Unknown',
    score: work.score ?? null,
    chapters: work.chapters ?? null,
    imageUrl,
    smallImageUrl,
    altImageText: work.title,
  }
}

/** Input rows required by {@link mapMangaDetails}. */
export interface MapMangaDetailsInput {
  work: MangaDB
  genres: { name: string }[]
  themes: { name: string }[]
  demographics: { name: string }[]
  characters: { characterId: number; name: string; role: string }[]
  staff: { staffId: number; name: string; role: string }[]
  publishers: { producerId: number; name: string; role: string }[]
  related: { relatedMangaId: number; title: string; relationType: string }[]
  externalLinks: { site: string; url: string; type: string | null }[]
}

/**
 * Maps the work, its taxonomy and its links into the detail payload.
 *
 * @param input - Source rows required for the detail page
 * @returns Public detail DTO with CDN URLs, slug and fallback copy
 */
export const mapMangaDetails = ({
  work,
  genres,
  themes,
  demographics,
  characters,
  staff,
  publishers,
  related,
  externalLinks,
}: MapMangaDetailsInput): MangaDetails => {
  const slug = normalizeString({
    string: work.title,
    separator: '-',
    toLowerCase: true,
  })
  return {
    malId: work.malId,
    title: work.title,
    titleEnglish: work.titleEnglish ?? null,
    titleJapanese: work.titleJapanese ?? null,
    type: work.type,
    status: work.status ?? 'Unknown',
    year: work.year ?? 0,
    chapters: work.chapters ?? null,
    volumes: work.volumes ?? null,
    score: work.score ?? null,
    synopsis: work.synopsis ?? 'No synopsis available.',
    background: work.background ?? '',
    serialization: work.serialization ?? null,
    countryOfOrigin: work.countryOfOrigin ?? null,
    publishedFrom: work.publishedFrom
      ? work.publishedFrom.toISOString().slice(0, 10)
      : null,
    publishedTo: work.publishedTo
      ? work.publishedTo.toISOString().slice(0, 10)
      : null,
    genres: genres.map((g) => g.name),
    themes: themes.map((t) => t.name),
    demographics: demographics.map((d) => d.name),
    imageUrl: buildMediaUrl({
      entity: 'manga',
      type: 'cover',
      size: 'large',
      entity_id: work.malId,
    }),
    smallImageUrl: buildMediaUrl({
      entity: 'manga',
      type: 'cover',
      size: 'small',
      entity_id: work.malId,
    }),
    bannerImageUrl: buildMediaUrl({
      entity: 'manga',
      type: 'banner',
      entity_id: work.malId,
    }),
    characters: characters.map((c) => ({
      characterId: c.characterId,
      name: c.name,
      role: c.role,
      imageUrl: buildMediaUrl({
        entity: 'character',
        type: 'poster',
        size: 'small',
        entity_id: c.characterId,
      }),
    })),
    staff: staff.map((s) => ({
      staffId: s.staffId,
      name: s.name,
      role: s.role,
      imageUrl: buildMediaUrl({
        entity: 'staff',
        type: 'poster',
        size: 'small',
        entity_id: s.staffId,
      }),
    })),
    publishers: publishers.map((p) => ({
      producerId: p.producerId,
      name: p.name,
      role: p.role,
    })),
    related: related.map((r) => ({
      mangaId: r.relatedMangaId,
      title: r.title,
      relationType: r.relationType,
    })),
    externalLinks: externalLinks.map((l) => ({
      site: l.site,
      url: l.url,
      type: l.type,
    })),
    slug,
    url: `${config.baseUrl}/manga/${work.malId}/${slug}`,
    altImageText: work.title,
  }
}
