import type { InferSelectModel } from 'drizzle-orm'
import { anime, animeTitleSynonym } from '@/core/db/schemas/anime'
import { animeExternalIds } from '@/core/db/schemas/anime-external'
import { animeTaxonomy } from '@/core/db/schemas/anime-taxonomy'
import {
  animeRelatedAnime,
  animeCharacter,
  animeDemographic,
  animeGenre,
  animeMusic,
  animeProducer,
  animeStaff,
  animeTheme,
} from '@/core/db/schemas/anime-relations'
import { characterVoiceActor } from '@/core/db/schemas/character-relations'
import { character, characterNickname } from '@/core/db/schemas/character'
import { animeMedia } from '@/core/db/schemas/anime-media'
import { producer } from '@/core/db/schemas/producer'
import { staff } from '@/core/db/schemas/staff'
import { animeMedia } from '@/core/db/schemas/anime-media'
import { characterMedia } from '@/core/db/schemas/character-media'
import { producerMedia } from '@/core/db/schemas/producer-media'
import { staffMedia } from '@/core/db/schemas/staff-media'
import { genre, theme, demographic } from '@/core/db/schemas/anime-taxonomy'

export type AnimeDB = InferSelectModel<typeof anime>
export type AnimeTitleSynonymDB = InferSelectModel<typeof animeTitleSynonym>
export type AnimeExternalDB = InferSelectModel<typeof animeExternalIds>
export type AnimeTaxonomyDB = InferSelectModel<typeof animeTaxonomy>
export type AnimeRelationsDB = InferSelectModel<typeof animeRelatedAnime>
export type CharacterDB = InferSelectModel<typeof character>
export type CharacterNicknameDB = InferSelectModel<typeof characterNickname>
export type ProducerDB = InferSelectModel<typeof producer>
export type StaffDB = InferSelectModel<typeof staff>
export type AnimeMediaDB = InferSelectModel<typeof animeMedia>
export type CharacterMediaDB = InferSelectModel<typeof characterMedia>
export type ProducerMediaDB = InferSelectModel<typeof producerMedia>
export type StaffMediaDB = InferSelectModel<typeof staffMedia>
export type GenreDB = InferSelectModel<typeof genre>
export type ThemeDB = InferSelectModel<typeof theme>
export type DemographicDB = InferSelectModel<typeof demographic>
export type AnimeCharacterDB = InferSelectModel<typeof animeCharacter>
export type AnimeProducerDB = InferSelectModel<typeof animeProducer>
export type AnimeStaffDB = InferSelectModel<typeof animeStaff>
export type AnimeThemeDB = InferSelectModel<typeof animeTheme>
export type AnimeGenreDB = InferSelectModel<typeof animeGenre>
export type CharacterVoiceActorDB = InferSelectModel<typeof characterVoiceActor>
