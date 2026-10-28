/**
 * Maps character rows to API DTOs.
 *
 * @module domains/people/mappers/character/mapper
 */
import { normalizeCastRole } from '@people/mappers/cast-role'
import {
  characterImageUrl,
  personImageUrl,
  workImageUrl,
} from '@people/mappers/media'
import type {
  AppearanceRow,
  CharacterAppearance,
  CharacterCard,
  CharacterCardRow,
  CharacterProfile,
  CharacterProfileRow,
  VoiceActorRow,
} from '@people/types'

/** Maps a search row to a {@link CharacterCard}. */
export const mapCharacterCard = ({
  malId,
  name,
  nameKanji,
  favorites,
}: CharacterCardRow): CharacterCard => ({
  malId,
  name,
  nameKanji,
  favorites,
  imageUrl: characterImageUrl(malId),
})

/**
 * Maps the profile row and its voice credits to a {@link CharacterProfile}.
 *
 * @param row - Character row
 * @param voices - Voice credits, ordered by language then name
 * @returns The profile with one voice group per language, in input order
 */
export const mapCharacterProfile = (
  row: CharacterProfileRow,
  voices: VoiceActorRow[]
): CharacterProfile => ({
  ...mapCharacterCard(row),
  about: row.about,
  gender: row.gender,
  dateOfBirth: row.dateOfBirth?.toISOString().slice(0, 10) ?? null,
  bloodType: row.bloodType,
  height: row.height,
  weight: row.weight,
  age: row.age,
  voiceActors: [...Map.groupBy(voices, (v) => v.language)].map(
    ([language, actors]) => ({
      language,
      actors: actors.map(({ staffId, name }) => ({
        staffId,
        name,
        imageUrl: personImageUrl(staffId),
      })),
    })
  ),
})

/** Maps an appearance row (normalizing its role). */
export const mapCharacterAppearance = ({
  medium,
  malId,
  title,
  role,
}: AppearanceRow): CharacterAppearance => ({
  medium,
  malId,
  title,
  role: normalizeCastRole(role),
  imageUrl: workImageUrl(medium, malId),
})
