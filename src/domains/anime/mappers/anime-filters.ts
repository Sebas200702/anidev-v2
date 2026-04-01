import type {
  AnimeFilters,
  AnimeFiltersParams,
} from '@/domains/anime/types/anime-list'

const toArray = <T>(value: T | T[] | undefined): T[] | undefined => {
  if (!value) {
    return undefined
  }
  return Array.isArray(value) ? value : [value]
}

export const mapAnimeFilters = (params: AnimeFiltersParams): AnimeFilters => {
  return {
    genre: toArray(params.genre),
    status: toArray(params.status),
    rating: toArray(params.rating),
    type: toArray(params.type),
    year: params.year ? params.year : undefined,
    page: params.page,
    limit: params.limit,
  }
}
