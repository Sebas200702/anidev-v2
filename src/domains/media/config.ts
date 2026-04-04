import { config } from '@/config'
import { MediaEntity, MediaType, type MediaServiceConfig } from './types/media'

export const mediaServiceConfig: MediaServiceConfig = {
  defaultQuality: 75,
  defaultFormat: 'webp',
  defaultPlaceholderUrl: `${config.baseUrl}/placeholder.webp`,
  supportedMediaTypes: [
    MediaType.POSTER,
    MediaType.BANNER,
    MediaType.BACKGROUND,
    MediaType.CLEARART,
    MediaType.CLEARLOGO,
    MediaType.ICON,
  ],
  supportedEntities: [
    MediaEntity.ANIME,
    MediaEntity.CHARACTER,
    MediaEntity.STAFF,
    MediaEntity.STUDIO,
  ],
}
