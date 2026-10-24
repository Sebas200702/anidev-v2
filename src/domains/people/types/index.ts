/**
 * Types of the people domain, inferred from its Zod schemas.
 *
 * @module domains/people/types
 */
import type { z } from 'zod'
import type { CAST_ROLES, PEOPLE_MEDIA } from '@people/constants'
import type {
  characterAppearanceSchema,
  characterCardSchema,
  characterProfileSchema,
} from '@people/schemas/character-schema'
import type {
  personCardSchema,
  personCreditSchema,
  personProfileSchema,
  personVoiceSchema,
} from '@people/schemas/person-schema'
import type { peopleSearchQuerySchema } from '@people/schemas/people-common-schema'

export type CastRole = (typeof CAST_ROLES)[number]
export type PeopleMedium = (typeof PEOPLE_MEDIA)[number]
export type PeopleSearchQuery = z.infer<typeof peopleSearchQuerySchema>
export type PeoplePage = { page: number; limit: number }

export type CharacterCard = z.infer<typeof characterCardSchema>
export type CharacterProfile = z.infer<typeof characterProfileSchema>
export type CharacterAppearance = z.infer<typeof characterAppearanceSchema>

export type PersonCard = z.infer<typeof personCardSchema>
export type PersonProfile = z.infer<typeof personProfileSchema>
export type PersonVoice = z.infer<typeof personVoiceSchema>
export type PersonCredit = z.infer<typeof personCreditSchema>
export type * from './rows'
