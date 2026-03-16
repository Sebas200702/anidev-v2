import { animeStaffSchema } from '@/domains/anime/schemas/anime-staff'
import { z } from 'zod'

export type AnimeStaff = z.infer<typeof animeStaffSchema>
