-- T1: name normalizer and source staging (runs against the fixtures in test/fixtures).
DO $$
BEGIN
  ASSERT norm_name('Honekawa, Suneo') = norm_name('Suneo Honekawa'),
    'MAL "Last, First" and AniList "First Last" normalize to the same key';
  ASSERT norm_name('Satō, Kōta') = norm_name('Kouta Satou'),
    'macrons normalize to doubled vowels';
  ASSERT norm_name('Jean-Pierre  Polnareff.') = norm_name('polnareff jean pierre'),
    'case, hyphens, dots and extra spaces are ignored';
  ASSERT norm_name('Doujima, Kengo') = norm_name('Kengo Dojima')
    AND norm_name('Monchi, Jouji') = norm_name('Joji Monchi')
    AND norm_name('Houjou, Tomoko') = norm_name('Tomoko Hojo')
    AND norm_name('Yuuko') = norm_name('Yuko'),
    'MAL long vowels (ou, uu) match the AniList short spelling';
  ASSERT norm_name('Hayashi') <> norm_name('Hayata'), 'distinct names stay distinct';
  ASSERT norm_name(NULL) IS NULL AND norm_name(' , ') IS NULL, 'empty names have no key';
END $$;

DO $$
DECLARE
  suneo anilist_cast%ROWTYPE;
BEGIN
  ASSERT (SELECT count(*) FROM anilist_cast WHERE anime_id = 100) = 2,
    'a character repeated across two AniList rows with the same idMal is loaded once';
  SELECT * INTO suneo FROM anilist_cast WHERE anime_id = 100 AND anilist_character_id = 501;
  ASSERT suneo.role = 'MAIN', 'role is kept';
  ASSERT suneo.name_full = 'Suneo Honekawa' AND suneo.name_native = '骨川スネ夫', 'names are kept';
  ASSERT suneo.image_url = 'https://s4.anilist.co/file/anilistcdn/character/large/b501.png',
    'the large image is kept';
  ASSERT suneo.name_keys @> ARRAY[norm_name('Honekawa, Suneo'), norm_name('Sune')],
    'name keys hold the full name and the alternatives';
  ASSERT (SELECT count(*) FROM anilist_cast WHERE anime_id = 400) = 25, 'all edges are loaded';
  ASSERT (SELECT count(*) FROM anilist_cast WHERE anime_id NOT IN (100, 400)) = 0,
    'rows without idMal or without cast add no characters';
END $$;

DO $$
BEGIN
  ASSERT (SELECT cast_size FROM anilist_cast_source WHERE anime_id = 100) = 2, 'cast size per anime';
  ASSERT (SELECT cast_size FROM anilist_cast_source WHERE anime_id = 400) = 25, 'truncated cast size';
  ASSERT (SELECT cast_size FROM anilist_cast_source WHERE anime_id = 300) = 0,
    'an anime in the CSV with an empty cast is recorded with size 0';
  ASSERT (SELECT source FROM anilist_cast_source WHERE anime_id = 100) = 'kaggle-csv', 'source tag';
  ASSERT (SELECT count(*) FROM anilist_cast_source) = 3, 'rows without idMal are skipped';
END $$;

DO $$
BEGIN
  ASSERT (SELECT anilist_id FROM anime_anilist_map WHERE mal_id = 300) = 9300, 'MAL → AniList id';
  ASSERT (SELECT anilist_id FROM anime_anilist_map WHERE mal_id = 801) = 9800,
    'every MAL id of an entry is mapped';
  ASSERT NOT EXISTS (SELECT 1 FROM anime_anilist_map WHERE mal_id = 700),
    'entries without an AniList source are skipped';
  ASSERT (SELECT count(*) FROM anime_anilist_map) = 3, 'the header line is ignored';
END $$;
