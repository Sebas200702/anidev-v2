import { ErrorCodes } from '@/core/errors/error-codes'
import { InfraError } from '@/core/errors/errors'
import { animeMediaRepository } from '@/domains/media/repositories/anime-media'
import { characterMediaRepository } from '@/domains/media/repositories/character-media'
import { staffMediaRepository } from '@/domains/media/repositories/staff-media'
import { MediaSize, type MediaAsset, type SemanticMediaPath } from '@/domains/media/types/media'

export const normalizeMediaId = (
  mediaId: number | undefined,
  total: number
): number => {
  const candidate = mediaId && mediaId > 0 ? mediaId : 1
  return Math.min(Math.max(candidate, 1), total)
}

export const normalizeAssetSize = (size: string | null): MediaSize => {
  if (size === MediaSize.SMALL || size === MediaSize.LARGE) {
    return size
  }

  return MediaSize.DEFAULT
}

export const resolveMediaAssets = async (
  params: SemanticMediaPath
): Promise<MediaAsset[]> => {
  if (params.entityType === 'anime') {
    return await animeMediaRepository.getMediaByEntityAndType({
      mediaType: params.mediaType,
      animeId: params.entityId,
    })
  } else if (params.entityType === 'character') {
    return await characterMediaRepository.getMediaByEntityAndType({
      mediaType: params.mediaType,
      characterId: params.entityId,
    })
  } else if (params.entityType === 'staff') {
    return await staffMediaRepository.getMediaByEntityAndType({
      mediaType: params.mediaType,
      staffId: params.entityId,
    })
  } else {
    throw new InfraError(
      ErrorCodes.INVALID_IMAGE_PATH,
      'Unsupported media entity type',
      { params }
    )
  }
}
