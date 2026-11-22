-- Cast-derived AniList ids (L7). The staging objects (norm_name, anilist_cast) are the real
-- cast-relink ones, created in the throwaway test schema; run.sh points cast_schema at it.
\ir ../../cast-relink/sql/01-staging.sql

-- 7 has no AniList id; its Jikan casts in anime 50 and 51 both match AniList 950 → 7 gets
-- 950, so the synthetic 1000000950 becomes its twin. 8 matches 951 in anime 50 and 952 in
-- anime 52 (inconsistent → none). 9 matches two entries of anime 50 (ambiguous → none).
-- 10 is only linked by an AniList (UPPERCASE) role → none. 5 keeps 600 although its cast
-- says 960 ('cast-disagrees'). 11 and 12 both derive 970, 13 derives 610 held by 14 →
-- 'shared-anilist'. 1's cast agrees with its own 501 (no conflict).
INSERT INTO "character" (mal_id, name, anilist_id, about) VALUES
  (7, 'Hinata, Shouyou', NULL, NULL), (8, 'Tsukishima, Kei', NULL, NULL),
  (9, 'Narrator', NULL, NULL), (10, 'Upper Only', NULL, NULL),
  (11, 'Twin Name', NULL, NULL), (12, 'Twin Name', NULL, NULL),
  (13, 'Mixed Claim', NULL, NULL), (14, 'Real E', 610, NULL),
  (1000000950, 'HINATA SHOYO', NULL, NULL);

INSERT INTO anime_character (anime_id, character_id, role) VALUES
  (50, 7, 'Main'), (51, 7, 'Supporting'), (50, 1000000950, 'MAIN'), -- moved
  (50, 8, 'Supporting'), (52, 8, 'Main'), (50, 9, 'Supporting'), (50, 10, 'MAIN'),
  (53, 11, 'Main'), (54, 12, 'Main'), (55, 13, 'Main'), (50, 5, 'Main'), (10, 1, 'Supporting');
INSERT INTO manga_character (manga_id, character_id, role) VALUES
  (34, 1000000950, 'MAIN'); -- moved

INSERT INTO anilist_cast (anime_id, anilist_character_id, role, name_full, name_keys)
SELECT anime_id, id, 'MAIN', full_name,
  array_remove(ARRAY[norm_name(full_name), norm_name(alias)], NULL)
FROM (VALUES
  (50, 950, 'Shoyo Hinata', 'Chibi-chan'), (51, 950, 'Shoyo Hinata', NULL),
  (50, 951, 'Kei Tsukishima', NULL), (52, 952, 'Kei Tsukishima', NULL),
  (50, 953, 'Narrator', NULL), (50, 954, 'Old Man', 'Narrator'),
  (50, 955, 'Upper Only', NULL), (53, 970, 'Twin Name', NULL), (54, 970, 'Twin Name', NULL),
  (55, 610, 'Mixed Claim', NULL), (50, 960, 'Real C', NULL), (10, 501, 'Real A', NULL)
) AS v (anime_id, id, full_name, alias);
