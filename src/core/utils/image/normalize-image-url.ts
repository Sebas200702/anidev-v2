import { mediaServiceConfig } from "@/domains/media/config"

export const normalizeImageUrl = (imageUrl: string | null | undefined): string => {
  if (typeof imageUrl !== 'string') {
    return mediaServiceConfig.defaultPlaceholderUrl
  }

  const normalized = imageUrl.trim()

  return normalized.length > 0
    ? normalized
    : mediaServiceConfig.defaultPlaceholderUrl
}
