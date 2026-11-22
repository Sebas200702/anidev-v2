-- Shadow copies of the public tables in the throwaway test schema (search_path puts it
-- first), plus minimal raw sources (anilist_raw / offline_raw point at them).
CREATE TABLE anime (LIKE public.anime INCLUDING ALL EXCLUDING DEFAULTS);
CREATE TABLE anime_relation (LIKE public.anime_relation INCLUDING ALL,
  FOREIGN KEY (anime_id) REFERENCES anime (mal_id) ON DELETE CASCADE,
  FOREIGN KEY (related_anime_id) REFERENCES anime (mal_id) ON DELETE CASCADE);
-- Only the AniList CSV columns the scripts read (same names as cast_relink.anilist_raw).
CREATE TABLE anilist_raw (c02 text, c03 text, c09 text, c10 text, c11 text, c12 text,
  c13 text, c14 text, c18 text, c19 text, c21 text, c53 text);
CREATE TABLE offline_db_raw (line text);

-- 1 agrees with every source (no change)       6 stored airing (excluded)
-- 2 empty: filled from AniList                 7 sources say airing: status only
-- 3 empty: filled from offline-db (no AniList) 8 unmapped vocab, ambiguous AniList
-- 4 both sources agree against stored (fix)    9 blank synopsis, no usable source
-- 5 sources disagree (no change)               10 related only (offline map)
--                                              12 offline-db says ongoing (episodes kept)
--                                              13 stored Music vs SPECIAL (type kept)
INSERT INTO anime (mal_id, title, type, status, episodes, year, season, synopsis,
                   aired_from) VALUES
  (1, 'Alpha', 'TV', 'Finished Airing', 12, 2001, 'spring', 'Old.', '2001-04-01+00'),
  (2, 'Beta', NULL, 'Finished Airing', NULL, NULL, NULL, NULL, NULL),
  (3, 'Gamma', NULL, 'Finished Airing', NULL, NULL, NULL, '', NULL),
  (4, 'Delta', 'TV', 'Finished Airing', 12, 2000, 'winter', 'D.', '2000-01-05+00'),
  (5, 'Epsilon', 'Special', 'Finished Airing', 12, 2000, 'winter', 'E.', NULL),
  (6, 'Zeta', 'TV', 'Currently Airing', 12, 2020, 'fall', 'Z.', '2020-10-01+00'),
  (7, 'Eta', 'TV', 'Finished Airing', 12, 2021, 'fall', 'H.', '2021-10-01+00'),
  (8, 'Theta', 'TV', 'Finished Airing', NULL, 2022, 'fall', 'T.', '2022-10-01+00'),
  (9, 'Iota', 'TV', 'Finished Airing', 3, 2023, 'fall', '  ', NULL),
  (10, 'Kappa', 'TV', 'Finished Airing', 1, 2024, 'fall', 'K.', '2024-10-01+00'),
  (12, 'Mu', 'TV', 'Finished Airing', 10, 2025, 'fall', 'M.', '2025-10-01+00'),
  (13, 'Nu', 'Music', 'Finished Airing', 1, 2025, 'fall', NULL, '2025-10-01+00');
INSERT INTO anime_relation VALUES (1, 'sequel', 2), (1, 'Side story', 4), (4, 'Other', 5);

INSERT INTO anilist_raw VALUES
  ('101', '1.0', 'TV', 'FINISHED', 'Old', '2001', '4.0', '1.0', 'SPRING', '2001.0', '12.0',
   '[{"relationType": "SEQUEL", "node": {"id": 102, "type": "ANIME"}},
     {"relationType": "SIDE_STORY", "node": {"id": 104, "type": "ANIME"}},
     {"relationType": "ADAPTATION", "node": {"id": 30001, "type": "MANGA"}},
     {"relationType": "SOURCE", "node": {"id": 103, "type": "ANIME"}},
     {"relationType": "ALTERNATIVE", "node": {"id": 999, "type": "ANIME"}},
     {"relationType": "CHARACTER", "node": {"id": 110, "type": "ANIME"}},
     {"relationType": "SPIN_OFF", "node": {"id": 111, "type": "ANIME"}}]'),
  ('102', '2.0', 'TV_SHORT', 'FINISHED',
   E'First<br><br>\nSecond &amp; <i>third</i>&#12354;&hellip; <!--link--><br />\r\nEnd',
   '2005', '10.0', '2.0', 'FALL', '2005.0', '24.0',
   '[{"relationType": "PREQUEL", "node": {"id": 101, "type": "ANIME"}}]'),
  ('104', '4.0', 'OVA', 'FINISHED', 'D', '2001', '1.0', '1.0', 'SPRING', '2001.0', '13.0', '[]'),
  ('105', '5.0', 'MUSIC', 'FINISHED', 'E', '2001', NULL, NULL, NULL, NULL, '13.0', 'nan'),
  ('106', '6.0', 'TV', 'FINISHED', 'Z', '2020', '10.0', '1.0', 'FALL', '2020.0', '24.0', ''),
  ('107', '7.0', 'TV', 'RELEASING', 'H', '2021', '10.0', '1.0', 'FALL', '2021.0', '24.0', ''),
  ('108', '8.0', 'TV', 'CANCELLED', 'T', '2022', '10.0', '1.0', 'FALL', '2022.0', '10.0',
   '[{"relationType": "SEQUEL", "node": {"id": 118, "type": "ANIME"}}]'),
  ('118', '8.0', 'TV', 'CANCELLED', 'T', '2022', '10.0', '1.0', 'FALL', '2022.0', '11.0', ''),
  ('109', '9.0', 'TV', 'FINISHED', '<br>', '2023', '10.0', NULL, NULL, NULL, '3.0', ''),
  ('112', '12.0', 'TV', 'FINISHED', 'M', '2025', '10.0', '1.0', 'FALL', '2025.0', '12.0', ''),
  ('113', '13.0', 'SPECIAL', 'FINISHED', ' n/a ', '2025', '10.0', '1.0', 'FALL', '2025.0', '1.0',
   ''),
  ('111', '11.0', 'TV', 'FINISHED', 'X', '2024', NULL, NULL, NULL, NULL, '1.0', ''),
  ('120', 'nan', 'TV', 'FINISHED', 'Y', '2024', NULL, NULL, NULL, NULL, '1.0', '');

INSERT INTO offline_db_raw VALUES
  ('{"$schema": "header line", "data": []}'),
  ('{"sources": ["https://anilist.co/anime/101", "https://myanimelist.net/anime/1"],
    "type": "TV", "episodes": 12, "status": "FINISHED",
    "animeSeason": {"season": "SPRING", "year": 2001},
    "relatedAnime": ["https://myanimelist.net/anime/2", "https://myanimelist.net/anime/5",
                     "https://kitsu.app/anime/77"]}'),
  ('{"sources": ["https://myanimelist.net/anime/3"], "type": "MOVIE", "episodes": 1,
    "status": "FINISHED", "animeSeason": {"season": "SUMMER", "year": 2010},
    "relatedAnime": []}'),
  ('{"sources": ["https://myanimelist.net/anime/4"], "type": "OVA", "episodes": 13,
    "status": "FINISHED", "animeSeason": {"season": "SPRING", "year": 2001}}'),
  ('{"sources": ["https://myanimelist.net/anime/5"], "type": "SPECIAL", "episodes": 14,
    "status": "FINISHED", "animeSeason": {"season": "UNDEFINED", "year": 2002}}'),
  ('{"sources": ["https://myanimelist.net/anime/6"], "type": "TV", "episodes": 24,
    "status": "FINISHED", "animeSeason": {"season": "FALL", "year": 2020}}'),
  ('{"sources": ["https://myanimelist.net/anime/7"], "type": "TV", "episodes": 24,
    "status": "ONGOING", "animeSeason": {"season": "FALL", "year": 2021}}'),
  ('{"sources": ["https://myanimelist.net/anime/8"], "type": "UNKNOWN", "episodes": 0,
    "status": "UNKNOWN", "animeSeason": {"season": "FALL", "year": 2022}}'),
  ('{"sources": ["https://anilist.co/anime/110", "https://myanimelist.net/anime/10"],
    "type": "TV", "episodes": 1, "status": "FINISHED",
    "animeSeason": {"season": "FALL", "year": 2024}}'),
  ('{"sources": ["https://myanimelist.net/anime/12"], "type": "TV", "episodes": 12,
    "status": "ONGOING", "animeSeason": {"season": "FALL", "year": 2025}}'),
  ('{"sources": ["https://myanimelist.net/anime/13"], "type": "SPECIAL", "episodes": 1,
    "status": "FINISHED", "animeSeason": {"season": "FALL", "year": 2025}}');

-- Snapshots of the state before any command, for the exact-rollback checks.
CREATE TABLE before_anime AS TABLE anime;
CREATE TABLE before_anime_relation AS TABLE anime_relation;

-- true when both tables hold exactly the same rows (multiset, both directions).
CREATE FUNCTION same_rows(a text, b text) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE result boolean;
BEGIN
  EXECUTE format('SELECT NOT EXISTS (TABLE %1$I EXCEPT ALL TABLE %2$I)
    AND NOT EXISTS (TABLE %2$I EXCEPT ALL TABLE %1$I)', a, b) INTO result;
  RETURN result;
END $$;

-- true when every public-table copy matches its snapshot with the given prefix.
CREATE FUNCTION all_same(prefix text) RETURNS boolean LANGUAGE sql AS $$
  SELECT same_rows('anime', prefix || 'anime')
    AND same_rows('anime_relation', prefix || 'anime_relation')
$$;
