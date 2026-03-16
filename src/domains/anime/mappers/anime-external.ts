import type { AnimeExternalDB } from "@/domains/anime/types/anime-db"
import type { AnimeExternalIds } from '@/domains/anime/types/anime-full'

export const mapExternalIds = (db: AnimeExternalDB): AnimeExternalIds[] => {
  const result: AnimeExternalIds[] = []

  if (db.animeThemesSlug) {
    result.push({
      id: db.animeThemesSlug,
      source: 'animeThemes',
    })
  }

  if (db.kitsuId !== null) {
    result.push({
      id: db.kitsuId,
      source: 'kitsu',
    })
  }

  if (db.tvdbId !== null) {
    result.push({
      id: db.tvdbId,
      source: 'tvdb',
    })
  }

  return result
}
