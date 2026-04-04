import { env } from '@/config/env'

const baseUrl = (env.APP_BASE_URL ?? env.BETTER_AUTH_URL).replace(/\/$/, '')

export const config = {
  baseUrl,
  baseTitle: 'AniDev',
  baseImage: `${baseUrl}/og-image.png`,
  baseDescription:
    'Discover, track, and share your anime journey with AniDev. Explore a vast library of anime titles, create personalized watchlists, and connect with fellow anime enthusiasts. Start your anime adventure today!',
}
