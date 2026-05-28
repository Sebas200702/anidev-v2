import { ErrorCodes } from '@/core/errors/error-codes'
import { DomainError } from '@/core/errors/errors'
import { mediaServiceConfig } from '@/domains/media/config'
import type {
  MediaEntity,
  MediaSize,
  MediaType,
  SemanticMediaPath,
} from '@/domains/media/types/media'
import { MediaSize as MediaSizeEnum } from '@/domains/media/types/media'
const isSupportedMediaType = (type: string): type is MediaType => {
  return mediaServiceConfig.supportedMediaTypes.includes(type as MediaType)
}

const isSupportedEntity = (entity: string): entity is MediaEntity => {
  return mediaServiceConfig.supportedEntities.includes(entity as MediaEntity)
}

const MEDIA_SIZES: Set<MediaSize> = new Set([
  MediaSizeEnum.DEFAULT,
  MediaSizeEnum.SMALL,
  MediaSizeEnum.LARGE,
])

const isSupportedMediaSize = (size: string): size is MediaSize => {
  return MEDIA_SIZES.has(size as MediaSize)
}

const parseMediaIndex = (segment?: string): number => {
  const parsedIndex = Number(segment)
  return Number.isInteger(parsedIndex) && parsedIndex > 0 ? parsedIndex : 1
}

const parseSizeAndIndex = (
  sizeOrIndexSegment?: string,
  indexSegment?: string
): { size: MediaSize; index: number } => {
  if (sizeOrIndexSegment && isSupportedMediaSize(sizeOrIndexSegment)) {
    return {
      size: sizeOrIndexSegment,
      index: parseMediaIndex(indexSegment),
    }
  }

  return {
    size: MediaSizeEnum.DEFAULT,
    index: parseMediaIndex(sizeOrIndexSegment),
  }
}

const parseTypeFirstPattern = (
  third?: string,
  fourth?: string,
  fifth?: string
): { type: MediaType; size: MediaSize; index: number; slug?: string } | null => {
  if (!third || !isSupportedMediaType(third)) {
    return null
  }

  const { size, index } = parseSizeAndIndex(fourth, fifth)
  return { type: third, size, index }
}

const parseSlugThenTypePattern = (
  third?: string,
  fourth?: string,
  fifth?: string,
  sixth?: string
): { type: MediaType; size: MediaSize; index: number; slug?: string } | null => {
  if (!third || !fourth || !isSupportedMediaType(fourth)) {
    return null
  }

  const { size, index } = parseSizeAndIndex(fifth, sixth)
  return { type: fourth, size, index, slug: third }
}

export const parseMediaPath = (rawPath: string): SemanticMediaPath | null => {
  const segments = rawPath.split('/').filter(Boolean)
  if (segments.length < 3 || segments.length > 6) {
    return null
  }

  const [entity, idSegment, third, fourth, fifth, sixth] = segments
  const id = Number(idSegment)
  if (!Number.isInteger(id) || id <= 0) {
    return null
  }

  if (!isSupportedEntity(entity)) {
    throw new DomainError(
      ErrorCodes.INVALID_IMAGE_PATH,
      'Unsupported entity in path',
      { rawPath }
    )
  }

  const parsed =
    parseTypeFirstPattern(third, fourth, fifth) ??
    parseSlugThenTypePattern(third, fourth, fifth, sixth)

  if (!parsed) {
    throw new DomainError(
      ErrorCodes.INVALID_IMAGE_PATH,
      'Unsupported media type in path',
      { rawPath }
    )
  }

  return {
    entityId: id,
    entityType: entity,
    mediaType: parsed.type,
    mediaSize: parsed.size,
    mediaId: parsed.index,
    slug: parsed.slug,
  }
}
