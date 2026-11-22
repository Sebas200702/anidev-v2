-- T4: apply the audit decisions (runs after 03-merge-api.test.sql, same schema). The
-- earlier fixtures are replaced. Anime 100 cast: 501 Suneo Honekawa, 502 Hayata,
-- 503 Kenji Mori (image), 504 Aiko Satou (no image); anime 200: 705 Taro Yamada;
-- anime 300 has no cast source (pending-api).
TRUNCATE anime_character, "character", anilist_cast, anilist_cast_source;
INSERT INTO anilist_cast_source (anime_id, cast_size, source) VALUES
  (100, 4, 'test'), (200, 1, 'test');
INSERT INTO anilist_cast (anime_id, anilist_character_id, role, name_full, name_native,
                          image_url, name_keys) VALUES
  (100, 501, 'MAIN', 'Suneo Honekawa', 'スネ夫', NULL, ARRAY[norm_name('Suneo Honekawa')]),
  (100, 502, 'SUPPORTING', 'Hayata', NULL, NULL, ARRAY[norm_name('Hayata')]),
  (100, 503, 'MAIN', 'Kenji Mori', '森', 'https://s4.anilist.co/b503.png',
   ARRAY[norm_name('Kenji Mori')]),
  -- AniList placeholder image counts as no image
  (100, 504, 'MAIN', 'Aiko Satou', NULL,
   'https://s4.anilist.co/file/anilistcdn/character/large/default.jpg',
   ARRAY[norm_name('Aiko Satou')]),
  (200, 705, 'MAIN', 'Taro Yamada', NULL, NULL, ARRAY[norm_name('Taro Yamada')]);

INSERT INTO "character" (mal_id, name, anilist_id) VALUES
  (10, 'Honekawa, Suneo', NULL), (11, 'Nobita', NULL), (20, 'Suneo Honekawa', NULL),
  (21, 'Hayata', NULL), (22, 'Satō, Aiko', NULL), (23, 'Nobody', NULL),
  (30, 'Kenji Mori', NULL), (31, 'Mori, Kenji', NULL), (40, 'Yamada, Taro', 999),
  (41, 'Taro Yamada', NULL), (60, 'Someone', NULL), (1000000501, 'Suneo Honekawa', 501),
  (1000000502, 'Hayata', 502);

CREATE TABLE character_media (id serial PRIMARY KEY, character_id integer NOT NULL,
  media_type text NOT NULL, src text NOT NULL, size text, source text,
  priority integer NOT NULL DEFAULT 100, UNIQUE (character_id, media_type, src));
INSERT INTO character_media (character_id, media_type, src, source, priority) VALUES
  (10, 'poster', 'https://cdn.myanimelist.net/10.jpg', 'mal', 20),
  (11, 'poster', 'https://cdn.myanimelist.net/11.jpg', 'mal', 25);

INSERT INTO anime_character (anime_id, character_id, role) VALUES
  -- Jikan cast (Title-case roles)
  (100, 10, 'Main'), (100, 11, 'Supporting'), (200, 40, 'Main'),
  -- UPPERCASE links
  (100, 11, 'MAIN'),                                   -- dedupe
  (100, 23, 'BACKGROUND'),                             -- quarantine
  (100, 1000000502, 'SUPPORTING'),                     -- keep
  (300, 60, 'MAIN'),                                   -- pending-api
  (100, 20, 'MAIN'), (100, 1000000501, 'SUPPORTING'),  -- two sources → Jikan 10
  (100, 30, 'MAIN'), (100, 31, 'MAIN'), (100, 31, 'SUPPORTING'), -- two → new 1e9+503
  (100, 21, 'SUPPORTING'), (100, 21, 'MAIN'),          -- → existing 1e9+502
  (100, 22, 'MAIN'),                                   -- → new 1e9+504, no image
  (200, 41, 'MAIN');                                   -- → Jikan 40, anilist_id conflict

CREATE TABLE links_before AS SELECT * FROM anime_character;
CREATE TABLE characters_before AS SELECT * FROM "character";
CREATE TABLE media_before AS SELECT * FROM character_media;

\ir ../sql/03-audit.sql
\ir ../sql/05-apply.sql

CREATE TEMP TABLE links_expected (anime_id integer, character_id integer, role text);
INSERT INTO links_expected VALUES
  (100, 10, 'Main'), (100, 11, 'Supporting'), (200, 40, 'Main'),
  (100, 1000000502, 'SUPPORTING'), (300, 60, 'MAIN'),
  (100, 1000000503, 'MAIN'), (100, 1000000503, 'SUPPORTING'),
  (100, 1000000502, 'MAIN'), (100, 1000000504, 'MAIN');

DO $$
BEGIN
  ASSERT NOT EXISTS (SELECT * FROM links_expected EXCEPT SELECT * FROM anime_character)
    AND NOT EXISTS (SELECT * FROM anime_character EXCEPT SELECT * FROM links_expected),
    format('anime_character after apply: %s',
      (SELECT string_agg(format('(%s,%s,%s)', anime_id, character_id, role), ' ')
       FROM anime_character));
  ASSERT (SELECT count(*) FROM removed_links) = 11
    AND (SELECT count(*) FROM removed_links WHERE decision = 'dedupe') = 1
    AND (SELECT count(*) FROM removed_links WHERE decision = 'quarantine') = 1
    AND (SELECT count(*) FROM removed_links WHERE decision = 'repoint') = 9,
    'every removed UPPERCASE row is logged with its decision';
  ASSERT NOT EXISTS (SELECT 1 FROM removed_links WHERE role <> upper(role)),
    'Title-case (Jikan) rows are never removed';
  ASSERT (SELECT count(*) FROM inserted_links) = 4
    AND NOT EXISTS (SELECT * FROM inserted_links EXCEPT SELECT * FROM links_expected),
    'only the four new links are logged as inserted';
  ASSERT (SELECT array_agg((mal_id, name, name_kanji, anilist_id)::text ORDER BY mal_id)
          FROM "character" WHERE mal_id IN (1000000503, 1000000504))
    = ARRAY[(1000000503, 'Kenji Mori', '森', 503)::text,
            (1000000504, 'Aiko Satou', NULL, 504)::text],
    'synthetic characters are created from the AniList cast';
  ASSERT (SELECT array_agg(mal_id ORDER BY mal_id) FROM created_characters)
    = ARRAY[1000000503, 1000000504], 'created characters are logged';
  ASSERT (SELECT array_agg((character_id, media_type, src, size, source, priority)::text)
          FROM character_media WHERE id IN (SELECT id FROM created_media))
    = ARRAY[(1000000503, 'poster', 'https://s4.anilist.co/b503.png', NULL, 'anilist',
             30)::text], 'one AniList poster for the created character with an image';
  ASSERT (SELECT count(*) FROM character_media) = 3, 'no other media is written';
  ASSERT (SELECT anilist_id FROM "character" WHERE mal_id = 10) = 501,
    'a real MAL target gets its AniList id';
  ASSERT (SELECT anilist_id FROM "character" WHERE mal_id = 40) = 999,
    'a different AniList id is never overwritten';
  ASSERT (SELECT array_agg((mal_id, previous_anilist_id, candidate_anilist_ids, status)::text
                           ORDER BY mal_id) FROM updated_characters)
    = ARRAY[(10, NULL, '{501}', 'set')::text, (40, 999, '{705}', 'conflict')::text],
    'anilist_id updates and conflicts are logged';
  ASSERT NOT EXISTS (SELECT * FROM characters_before WHERE mal_id NOT IN (10)
                     EXCEPT SELECT * FROM "character"),
    'no other character row changes';
END $$;
