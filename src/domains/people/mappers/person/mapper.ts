/**
 * Maps person rows to API DTOs.
 *
 * @module domains/people/mappers/person/mapper
 */
import {
  characterImageUrl,
  personImageUrl,
  workImageUrl,
} from '@people/mappers/media'
import type {
  PersonCard,
  PersonCardRow,
  PersonCountsRow,
  PersonCredit,
  PersonCreditRow,
  PersonProfile,
  PersonProfileRow,
  PersonVoice,
  PersonVoiceRow,
} from '@people/types'

/** Maps a search row to a {@link PersonCard}. */
export const mapPersonCard = ({
  malId,
  name,
  favorites,
}: PersonCardRow): PersonCard => ({
  malId,
  name,
  favorites,
  imageUrl: personImageUrl(malId),
})

/** Maps the profile row and its credit counts to a {@link PersonProfile}. */
export const mapPersonProfile = (
  row: PersonProfileRow,
  counts: PersonCountsRow
): PersonProfile => ({
  ...mapPersonCard(row),
  givenName: row.givenName,
  familyName: row.familyName,
  birthday: row.birthday,
  gender: row.gender,
  about: row.about,
  counts,
})

/** Maps a voiced character with its anime. */
export const mapPersonVoice = ({
  characterId,
  characterName,
  language,
  anime,
}: PersonVoiceRow): PersonVoice => ({
  character: {
    malId: characterId,
    name: characterName,
    imageUrl: characterImageUrl(characterId),
  },
  language,
  anime: (anime ?? []).map(({ malId, title }) => ({
    malId,
    title,
    imageUrl: workImageUrl('anime', malId),
  })),
})

/** Maps a staff credit (one work, every position). */
export const mapPersonCredit = ({
  medium,
  malId,
  title,
  positions,
}: PersonCreditRow): PersonCredit => ({
  medium,
  malId,
  title,
  positions,
  imageUrl: workImageUrl(medium, malId),
})
