/**
 * Loads media assets for a semantic path from entity repositories.
 *
 * @module domains/media/services/resolve-media-assets/service
 */
import { ErrorCodes } from '@shared/errors/codes'
import { DomainError } from '@shared/errors/app-error'
import { animeMediaRepository } from '@media/repositories/anime-media'
import { mangaMediaRepository } from '@media/repositories/manga-media'
import { characterMediaRepository } from '@media/repositories/character-media'
import { staffMediaRepository } from '@media/repositories/staff-media'
import { episodeMediaRepository } from '@media/repositories/episode-media'
import { musicMediaRepository } from '@media/repositories/music-media'
import type { MediaAsset, SemanticMediaPath } from '@media/types/media-types'

/**
 * Loads all media assets for the entity described by a semantic media path.
 *
 * @param params - Parsed path with `entityType`, `entityId`, and `mediaType`
 * @returns Media assets from the appropriate domain repository
 * @throws {DomainError} When `params.entityType` is unsupported — code `INVALID_IMAGE_PATH`, maps to HTTP 400
 */
export const resolveMediaAssets = async (
  params: SemanticMediaPath
): Promise<MediaAsset[]> => {
  if (params.entityType === 'anime') {
    return await animeMediaRepository.getMediaByEntityAndType({
      mediaType: params.mediaType,
      animeId: params.entityId,
    })
  }

  if (params.entityType === 'manga') {
    return await mangaMediaRepository.getMediaByEntityAndType({
      mediaType: params.mediaType,
      mangaId: params.entityId,
    })
  }

  if (params.entityType === 'character') {
    return await characterMediaRepository.getMediaByEntityAndType({
      mediaType: params.mediaType,
      characterId: params.entityId,
    })
  }

  if (params.entityType === 'staff') {
    return await staffMediaRepository.getMediaByEntityAndType({
      mediaType: params.mediaType,
      staffId: params.entityId,
    })
  }

  if (params.entityType === 'episode') {
    return await episodeMediaRepository.getMediaByEntityAndType({
      mediaType: params.mediaType,
      episodeId: params.entityId,
    })
  }

  if (params.entityType === 'music') {
    return await musicMediaRepository.getMediaByEntityAndType({
      mediaType: params.mediaType,
      musicId: params.entityId,
      version: params.version,
      resolution: params.resolution,
    })
  }

  throw new DomainError(
    ErrorCodes.INVALID_IMAGE_PATH,
    'Unsupported media entity type',
    { params }
  )
}
