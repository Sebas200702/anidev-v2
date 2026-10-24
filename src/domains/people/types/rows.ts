/**
 * Database row shapes shared by the people repositories and mappers.
 *
 * @module domains/people/types/rows
 * @remarks Declared as `type` aliases so raw `db.execute<Row>()` accepts them.
 */
import type { PeopleMedium } from './index'

export type CharacterCardRow = {
  malId: number
  name: string
  nameKanji: string | null
  favorites: number | null
}

export type CharacterProfileRow = CharacterCardRow & {
  about: string | null
  gender: string | null
  dateOfBirth: Date | null
  bloodType: string | null
  height: number | null
  weight: number | null
  age: string | null
}

export type VoiceActorRow = { language: string; staffId: number; name: string }

export type AppearanceRow = {
  medium: PeopleMedium
  malId: number
  title: string
  role: string
}

export type PersonCardRow = {
  malId: number
  name: string
  favorites: number | null
}

export type PersonProfileRow = PersonCardRow & {
  givenName: string | null
  familyName: string | null
  birthday: string | null
  gender: string | null
  about: string | null
}

export type PersonCountsRow = {
  voices: number
  animeCredits: number
  mangaCredits: number
  music: number
}

export type PersonVoiceRow = {
  characterId: number
  characterName: string
  language: string
  anime: { malId: number; title: string }[] | null
}

export type PersonCreditRow = {
  medium: PeopleMedium
  malId: number
  title: string
  positions: string[]
}
