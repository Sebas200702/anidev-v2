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

-- Real MAL characters R (< 1e9) and AniList-only synthetics S = 1e9 + X.
--   1 Hinata ≡ 950 in manga 10 and 11 (consistent) → merge 1000000950 into 1
--   2 Doujima ≡ 507 (long vowel "Doujima, Kengo" = "Kengo Dojima") → merge 1000000507
--   3 Narrator: two cast entries match in manga 10 → ambiguous, untouched
--   4 Mori already holds AniList 999 (≠ 503) → anilist-disagrees, untouched
--   5 Kageyama: 960 in manga 10, 961 in manga 11 → inconsistent (ambiguous), untouched
--   7 and 8 'Twin Name' both derive 970 in manga 30 → shared-anilist, untouched
--   6 Hayata: Title-case + UPPERCASE row in manga 10 → kind A only
INSERT INTO "character" (mal_id, name, anilist_id, about) VALUES
  (1, 'Hinata, Shouyou', NULL, 'MAL bio'), (2, 'Doujima, Kengo', NULL, NULL),
  (3, 'Narrator', NULL, NULL), (4, 'Mori, Kenji', 999, NULL),
  (5, 'Kageyama, Tobio', NULL, NULL), (6, 'Hayata', NULL, NULL),
  (7, 'Twin Name', NULL, NULL), (8, 'Twin Name', NULL, NULL),
  (1000000950, 'Shoyo Hinata', NULL, 'AniList bio'), (1000000507, 'Kengo Dojima', NULL, NULL),
  (1000000953, 'Narrator', NULL, NULL), (1000000503, 'Kenji Mori', NULL, NULL),
  (1000000960, 'Tobio Kageyama', NULL, NULL), (1000000970, 'Twin Name', NULL, NULL);
INSERT INTO character_external (character_id, mal_id, anilist_id, created_at, updated_at)
SELECT mal_id, CASE WHEN mal_id < 1000000000 THEN mal_id END,
  CASE WHEN mal_id >= 1000000000 THEN mal_id - 1000000000 WHEN mal_id = 4 THEN 999 END,
  '2026-01-01', '2026-01-02 03:04:05.678901'
FROM "character";

INSERT INTO manga_character (manga_id, character_id, role) VALUES
  (10, 1, 'Main'), (10, 1000000950, 'MAIN'),   -- moved, then kind A (merged-pair)
  (11, 1, 'Main'), (11, 1, 'MAIN'),            -- kind A (same-pair)
  (11, 1000000950, 'MAIN'),                    -- skipped: 1 already holds (11, MAIN)
  (12, 1000000950, 'SUPPORTING'),              -- moved, stays
  (20, 2, 'Supporting'), (20, 1000000507, 'SUPPORTING'), -- moved, then kind A
  (10, 3, 'Supporting'), (10, 1000000953, 'BACKGROUND'),
  (10, 4, 'Supporting'), (10, 1000000503, 'SUPPORTING'),
  (10, 5, 'Main'), (11, 5, 'Main'), (10, 1000000960, 'MAIN'),
  (10, 6, 'Supporting'), (10, 6, 'SUPPORTING'), -- kind A (same-pair)
  (30, 7, 'Main'), (30, 8, 'Supporting'), (30, 1000000970, 'MAIN');
INSERT INTO anime_character (anime_id, character_id, role) VALUES
  (50, 1, 'Main'), (50, 1000000950, 'Main'),  -- skipped
  (50, 1000000950, 'MAIN'), (51, 1000000507, 'MAIN'); -- moved
INSERT INTO character_voice_actor (character_id, staff_id, language) VALUES
  (1, 900, 'Japanese'), (1000000950, 900, 'Japanese'), (1000000950, 901, 'English');
INSERT INTO character_nickname (id, character_id, nickname) VALUES
  (1, 1, 'Chibi'), (2, 1000000950, 'Chibi'), (3, 1000000950, 'Shrimpy');
INSERT INTO character_media (id, character_id, media_type, src, size, source, priority) VALUES
  (1, 1, 'poster', 'h.jpg', NULL, 'mal', 20),
  (2, 1000000950, 'poster', 'h.jpg', NULL, 'anilist', 30),   -- skipped
  (3, 1000000950, 'poster', 'h2.jpg', 'large', 'anilist', 30); -- moved

-- AniList manga casts (manga_cast_relink.manga_cast shape).
INSERT INTO :"relink_schema".manga_cast (manga_id, anilist_character_id, role, name_full,
  name_keys)
SELECT manga_id, id, 'MAIN', full_name, array_remove(ARRAY[
  :"relink_schema".norm_name(full_name), :"relink_schema".norm_name(alias)], NULL)
FROM (VALUES
  (10, 950, 'Shoyo Hinata', 'Chibi-chan'), (11, 950, 'Shoyo Hinata', NULL),
  (20, 507, 'Kengo Dojima', NULL), (10, 953, 'Narrator', NULL),
  (10, 954, 'Old Man', 'Narrator'), (10, 503, 'Kenji Mori', NULL),
  (10, 960, 'Tobio Kageyama', NULL), (11, 961, 'Tobio Kageyama', NULL),
  (30, 970, 'Twin Name', NULL), (10, 502, 'Hayata', NULL)
) AS v (manga_id, id, full_name, alias);

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

-- Copies every table into snapshots with the given prefix.
CREATE FUNCTION snapshot(prefix text) RETURNS void LANGUAGE plpgsql AS $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['character', 'character_external', 'anime_character',
    'manga_character', 'character_voice_actor', 'character_nickname', 'character_media']
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS %I; CREATE TABLE %1$I AS TABLE %I', prefix || t, t);
  END LOOP;
END $$;
