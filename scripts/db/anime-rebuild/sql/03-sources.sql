-- Projects the raw sources (psql variables anilist_raw, offline_raw) into TEMP tables,
-- one row per MAL id, values already in the app vocabulary. No persistent write.
DROP TABLE IF EXISTS anilist_rows, offline_rows, ani_map, src_anilist, src_offline,
  anilist_edges, offline_related;

-- c02 id, c03 idMal ("123.0"), c09 format, c10 status, c11 description, c12-c14 start
-- y/m/d, c18 season, c19 seasonYear, c21 episodes, c53 relations (JSON edges).
CREATE TEMP TABLE anilist_rows AS
SELECT c02::integer AS anilist_id,
  pg_temp.num(c03) AS mal_id,
  nullif(c09, '') AS format, nullif(c10, '') AS status, c11 AS description,
  pg_temp.num(c12) AS start_year,
  pg_temp.num(c13) AS start_month,
  pg_temp.num(c14) AS start_day,
  nullif(c18, '') AS season, pg_temp.num(c19) AS season_year,
  pg_temp.num(c21) AS episodes,
  CASE WHEN c53 ~ '^\s*\[' THEN c53::jsonb ELSE '[]'::jsonb END AS relations
FROM :anilist_raw
WHERE c02 ~ '^\d+$';

-- The first line of the JSONL is a header (no "sources"). One row per (entry, MAL id).
CREATE TEMP TABLE offline_rows AS
SELECT (regexp_match(s, 'myanimelist\.net/anime/(\d+)'))[1]::integer AS mal_id, j
FROM (SELECT line::jsonb AS j FROM :offline_raw) r
CROSS JOIN LATERAL jsonb_array_elements_text(r.j -> 'sources') s
WHERE r.j ? 'sources' AND s ~ 'myanimelist\.net/anime/\d+';

-- AniList id → MAL id: AniList's own idMal first, then the offline-db sources.
CREATE TEMP TABLE ani_map AS
SELECT anilist_id, mal_id FROM anilist_rows WHERE mal_id IS NOT NULL;
INSERT INTO ani_map
SELECT DISTINCT ON (a.id) a.id, o.mal_id
FROM offline_rows o
CROSS JOIN LATERAL (
  SELECT (regexp_match(s, 'anilist\.co/anime/(\d+)'))[1]::integer AS id
  FROM jsonb_array_elements_text(o.j -> 'sources') s WHERE s ~ 'anilist\.co/anime/\d+'
) a
WHERE NOT EXISTS (SELECT 1 FROM ani_map m WHERE m.anilist_id = a.id)
ORDER BY a.id, o.mal_id;

-- One value per MAL id and field, only when every AniList entry with that idMal agrees
-- (an ambiguous field gives NULL). aired_from needs a full start date.
CREATE TEMP TABLE src_anilist AS
SELECT mal_id,
  CASE WHEN count(DISTINCT syn) = 1 THEN min(syn) END AS synopsis,
  CASE WHEN count(DISTINCT eps) = 1 THEN min(eps) END AS episodes,
  CASE WHEN count(DISTINCT yr) = 1 THEN min(yr) END AS year,
  CASE WHEN count(DISTINCT sea) = 1 THEN min(sea) END AS season,
  CASE WHEN count(DISTINCT typ) = 1 THEN min(typ) END AS type,
  CASE WHEN count(DISTINCT sta) = 1 THEN min(sta) END AS status,
  CASE WHEN count(DISTINCT aired) = 1 THEN min(aired) END AS aired_from
FROM (
  SELECT r.mal_id, pg_temp.strip_html(r.description) AS syn,
    nullif(r.episodes, 0) AS eps, coalesce(r.season_year, r.start_year) AS yr,
    vs.app_value AS sea, vt.app_value AS typ, vst.app_value AS sta,
    pg_temp.start_date(r.start_year, r.start_month, r.start_day) AS aired
  FROM anilist_rows r
  LEFT JOIN vocab vs ON (vs.kind, vs.source, vs.source_value) = ('season', 'anilist', r.season)
  LEFT JOIN vocab vt ON (vt.kind, vt.source, vt.source_value) = ('type', 'anilist', r.format)
  LEFT JOIN vocab vst ON (vst.kind, vst.source, vst.source_value)
    = ('status', 'anilist', r.status)
  WHERE r.mal_id IS NOT NULL
) s
GROUP BY mal_id;

-- Same consensus rule over the offline-db entries listing the MAL id. Episodes 0 = unknown.
CREATE TEMP TABLE src_offline AS
SELECT mal_id,
  CASE WHEN count(DISTINCT eps) = 1 THEN min(eps) END AS episodes,
  CASE WHEN count(DISTINCT yr) = 1 THEN min(yr) END AS year,
  CASE WHEN count(DISTINCT sea) = 1 THEN min(sea) END AS season,
  CASE WHEN count(DISTINCT typ) = 1 THEN min(typ) END AS type,
  CASE WHEN count(DISTINCT sta) = 1 THEN min(sta) END AS status
FROM (
  SELECT o.mal_id, nullif((o.j ->> 'episodes')::integer, 0) AS eps,
    (o.j -> 'animeSeason' ->> 'year')::integer AS yr,
    vs.app_value AS sea, vt.app_value AS typ, vst.app_value AS sta
  FROM offline_rows o
  LEFT JOIN vocab vs ON (vs.kind, vs.source, vs.source_value)
    = ('season', 'offline', o.j -> 'animeSeason' ->> 'season')
  LEFT JOIN vocab vt ON (vt.kind, vt.source, vt.source_value) = ('type', 'offline', o.j ->> 'type')
  LEFT JOIN vocab vst ON (vst.kind, vst.source, vst.source_value)
    = ('status', 'offline', o.j ->> 'status')
) s
GROUP BY mal_id;

-- AniList relation edges between anime, MAL-keyed when both ends map.
CREATE TEMP TABLE anilist_edges AS
SELECT DISTINCT m.mal_id AS anime_id, e ->> 'relationType' AS anilist_type,
  e -> 'node' ->> 'type' AS node_type, (e -> 'node' ->> 'id')::integer AS node_anilist_id,
  n.mal_id AS related_anime_id
FROM anilist_rows r
JOIN ani_map m ON m.anilist_id = r.anilist_id
CROSS JOIN LATERAL jsonb_array_elements(r.relations) e
LEFT JOIN ani_map n ON n.anilist_id = (e -> 'node' ->> 'id')::integer;

-- offline-db relatedAnime (untyped): MAL → MAL pairs, for the report only.
CREATE TEMP TABLE offline_related AS
SELECT DISTINCT o.mal_id AS anime_id,
  (regexp_match(u, 'myanimelist\.net/anime/(\d+)'))[1]::integer AS related_anime_id
FROM offline_rows o
CROSS JOIN LATERAL jsonb_array_elements_text(coalesce(o.j -> 'relatedAnime', '[]')) u
WHERE u ~ 'myanimelist\.net/anime/\d+';
