-- Shadow copies of the public tables in the throwaway test schema (search_path puts it
-- first), with the same keys, unique indexes and ON DELETE CASCADE FKs to "character".
-- No public sequence is touched: character_media ids come from a test sequence.
CREATE TABLE "character" (LIKE public."character" INCLUDING ALL EXCLUDING DEFAULTS);
CREATE TABLE character_external (LIKE public.character_external INCLUDING ALL EXCLUDING DEFAULTS,
  FOREIGN KEY (character_id) REFERENCES "character" (mal_id) ON DELETE CASCADE);
CREATE TABLE anime_character (LIKE public.anime_character INCLUDING ALL EXCLUDING DEFAULTS,
  FOREIGN KEY (character_id) REFERENCES "character" (mal_id) ON DELETE CASCADE);
CREATE TABLE manga_character (LIKE public.manga_character INCLUDING ALL EXCLUDING DEFAULTS,
  FOREIGN KEY (character_id) REFERENCES "character" (mal_id) ON DELETE CASCADE);
CREATE TABLE character_voice_actor (LIKE public.character_voice_actor
  INCLUDING ALL EXCLUDING DEFAULTS,
  FOREIGN KEY (character_id) REFERENCES "character" (mal_id) ON DELETE CASCADE);
CREATE TABLE character_nickname (LIKE public.character_nickname INCLUDING ALL EXCLUDING DEFAULTS,
  FOREIGN KEY (character_id) REFERENCES "character" (mal_id) ON DELETE CASCADE);
CREATE SEQUENCE character_media_test_seq START 100;
CREATE TABLE character_media (LIKE public.character_media INCLUDING ALL EXCLUDING DEFAULTS,
  FOREIGN KEY (character_id) REFERENCES "character" (mal_id) ON DELETE CASCADE);
ALTER TABLE character_media ALTER id SET DEFAULT nextval('character_media_test_seq');

-- Manga 10 AniList cast (fixtures/manga-api.jsonl): 501 Suneo Honekawa, 502 Hayata,
-- 503 Kenji Mori (image), 504 + 505 Narrator (default.jpg / image), 506 Aiko, 507 Kengo
-- Dojima. 30 not found, 40 errored, 50 never fetched, 60 found with an empty cast.
INSERT INTO "character" (mal_id, name, name_kanji) VALUES
  (1, 'Suneo Honekawa', NULL), (2, 'Honekawa, Suneo', NULL), (3, 'Kenji Mori', NULL),
  (4, 'Hayata', NULL), (5, 'Narrator', NULL), (6, 'Nobody', NULL),
  (7, 'Taro', NULL), (8, 'Jiro', NULL), (9, 'Saburo', NULL),
  (11, 'Doujima, Kengo', NULL), (12, 'Mori, Kenji', NULL),
  (20, 'Hayata', 'ハヤタ'), (21, 'Aiko', NULL), (1000000507, 'Kengo Dojima', NULL);
INSERT INTO character_external (character_id, mal_id, anilist_id, created_at, updated_at)
SELECT mal_id, CASE WHEN mal_id < 1000000000 THEN mal_id END,
  CASE mal_id WHEN 1 THEN 501 WHEN 3 THEN 999 WHEN 20 THEN 502 WHEN 21 THEN 506
    WHEN 1000000507 THEN 507 END,
  '2026-01-01', '2026-01-01'
FROM "character";
INSERT INTO character_media (id, character_id, media_type, src, size, source, priority)
VALUES (1, 1, 'poster', 'https://cdn.myanimelist.net/1.jpg', NULL, 'mal', 20);

INSERT INTO manga_character (manga_id, character_id, role) VALUES
  (10, 1, 'MAIN'), (10, 1, 'Main'),             -- keep + case duplicate
  (10, 2, 'MAIN'),                              -- repoint → 1 (already linked)
  (10, 3, 'MAIN'), (10, 3, 'BACKGROUND'),       -- repoint → new 1e9+503
  (10, 12, 'MAIN'),                             -- repoint → new 1e9+503 (shared)
  (10, 4, 'SUPPORTING'),                        -- repoint → existing 20 (external 502)
  (10, 11, 'MAIN'),                             -- repoint → existing 1e9+507 (long vowel)
  (10, 5, 'BACKGROUND'),                        -- quarantine ambiguous
  (10, 6, 'BACKGROUND'),                        -- quarantine no-anilist-match
  (30, 7, 'MAIN'), (40, 8, 'MAIN'), (50, 9, 'MAIN'), (60, 9, 'SUPPORTING'); -- pending

-- Snapshots of the state before apply, for the exact-rollback checks.
CREATE TABLE before_character AS TABLE "character";
CREATE TABLE before_character_external AS TABLE character_external;
CREATE TABLE before_manga_character AS TABLE manga_character;
CREATE TABLE before_character_media AS TABLE character_media;

-- true when both tables hold exactly the same rows (multiset, both directions).
CREATE FUNCTION same_rows(a text, b text) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE result boolean;
BEGIN
  EXECUTE format('SELECT NOT EXISTS (TABLE %1$I EXCEPT ALL TABLE %2$I)
    AND NOT EXISTS (TABLE %2$I EXCEPT ALL TABLE %1$I)', a, b) INTO result;
  RETURN result;
END $$;

-- true when every written table matches its snapshot with the given prefix.
CREATE FUNCTION all_same(prefix text) RETURNS boolean LANGUAGE sql AS $$
  SELECT bool_and(same_rows(t, prefix || t)) FROM unnest(ARRAY['character',
    'character_external', 'manga_character', 'character_media']) AS t
$$;
