-- Shadow copies of the public tables in the throwaway test schema (search_path puts it
-- first), with the same keys, unique indexes and ON DELETE CASCADE FKs to "character".
-- Defaults are excluded so no public sequence is touched: fixtures give explicit ids.
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
CREATE TABLE character_media (LIKE public.character_media INCLUDING ALL EXCLUDING DEFAULTS,
  FOREIGN KEY (character_id) REFERENCES "character" (mal_id) ON DELETE CASCADE);

-- 1 ↔ 1000000501 and 6 ↔ 1000000502 are twins; 3 and 4 share AniList 700 (conflict) and
-- 1000000700 is their ambiguous twin; 5 and 1000000800 have no twin; 2 has no AniList id.
INSERT INTO "character" (mal_id, name, anilist_id, about) VALUES
  (1, 'Real A', 501, 'MAL bio'), (2, 'Real B', NULL, NULL), (3, 'Shared X', 700, NULL),
  (4, 'Shared X', 700, NULL), (5, 'Real C', 600, NULL), (6, 'Real D', 502, NULL),
  (1000000501, 'REAL A', NULL, 'AniList bio'), (1000000502, 'REAL D', 502, NULL),
  (1000000700, 'SHARED X', NULL, NULL), (1000000800, 'Only AniList', 800, NULL);

INSERT INTO anime_character (anime_id, character_id, role) VALUES
  (10, 1, 'Main'), (10, 1000000501, 'Main'),               -- duplicate → skipped
  (10, 1000000501, 'MAIN'), (20, 1000000501, 'SUPPORTING'), -- moved
  (10, 1000000700, 'MAIN'), (40, 1000000800, 'MAIN'), (40, 2, 'Main');
INSERT INTO manga_character (manga_id, character_id, role) VALUES
  (30, 1, 'MAIN'), (30, 1000000501, 'MAIN'),                -- duplicate → skipped
  (31, 1000000501, 'MAIN'), (32, 1000000502, 'SUPPORTING'), -- moved
  (33, 3, 'MAIN');
INSERT INTO character_voice_actor (character_id, staff_id, language) VALUES
  (1, 900, 'Japanese'), (1000000501, 900, 'Japanese'),      -- duplicate → skipped
  (1000000501, 901, 'English'), (1000000502, 902, 'Japanese'); -- moved
INSERT INTO character_nickname (id, character_id, nickname) VALUES
  (1, 1, 'Ace'), (2, 1000000501, 'Ace'),                    -- duplicate → skipped
  (3, 1000000501, 'Spade'), (4, 1000000502, 'Dee'),         -- moved
  (5, 1000000700, 'Ex');
INSERT INTO character_media (id, character_id, media_type, src, size, source, priority) VALUES
  (1, 1, 'poster', 'a.jpg', NULL, 'mal', 20),
  (2, 1000000501, 'poster', 'a.jpg', NULL, 'anilist', 30),  -- duplicate → skipped
  (3, 1000000501, 'poster', 'b.jpg', NULL, 'anilist', 30),  -- moved
  (4, 1000000502, 'poster', 'd.jpg', 'large', 'anilist', 30); -- moved

\ir cast-fixtures.sql

-- Snapshots of the state before any command, for the exact-rollback checks.
CREATE TABLE before_character AS TABLE "character";
CREATE TABLE before_character_external AS TABLE character_external;
CREATE TABLE before_anime_character AS TABLE anime_character;
CREATE TABLE before_manga_character AS TABLE manga_character;
CREATE TABLE before_character_voice_actor AS TABLE character_voice_actor;
CREATE TABLE before_character_nickname AS TABLE character_nickname;
CREATE TABLE before_character_media AS TABLE character_media;

-- true when both tables hold exactly the same rows (multiset, both directions).
CREATE FUNCTION same_rows(a text, b text) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE result boolean;
BEGIN
  EXECUTE format('SELECT NOT EXISTS (TABLE %1$I EXCEPT ALL TABLE %2$I)
    AND NOT EXISTS (TABLE %2$I EXCEPT ALL TABLE %1$I)', a, b) INTO result;
  RETURN result;
END $$;

-- true when every table matches its snapshot with the given prefix.
CREATE FUNCTION all_same(prefix text) RETURNS boolean LANGUAGE sql AS $$
  SELECT bool_and(same_rows(t, prefix || t)) FROM unnest(ARRAY['character',
    'character_external', 'anime_character', 'manga_character', 'character_voice_actor',
    'character_nickname', 'character_media']) AS t
$$;
