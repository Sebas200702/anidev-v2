-- Builds the rebuild plan in TEMP tables (no persistent write): relation edges to insert,
-- field fills and source-majority corrections, plus the report-only tables.
\ir 02-functions.sql
\ir 03-sources.sql
DROP TABLE IF EXISTS field_candidates, field_plan, majority_excluded, relation_plan,
  offline_untyped, unmapped_vocab;

-- One row per (anime, field): stored value (NULL when empty), the raw previous value,
-- the AniList and offline-db values (text, app vocabulary) and the statuses.
CREATE TEMP TABLE field_candidates AS
SELECT a.mal_id AS anime_id, a.status AS stored_status, sa.status AS anilist_status,
  so.status AS offline_status, f.*
FROM anime a
LEFT JOIN src_anilist sa ON sa.mal_id = a.mal_id
LEFT JOIN src_offline so ON so.mal_id = a.mal_id
CROSS JOIN LATERAL (VALUES
  ('synopsis', nullif(btrim(a.synopsis), ''), a.synopsis, sa.synopsis, NULL),
  ('episodes', a.episodes::text, a.episodes::text, sa.episodes::text, so.episodes::text),
  ('year', a.year::text, a.year::text, sa.year::text, so.year::text),
  ('season', a.season, a.season, sa.season, so.season),
  ('type', a.type, a.type, sa.type, so.type),
  ('status', a.status, a.status, sa.status, so.status),
  ('aired_from', pg_temp.ts_text(a.aired_from), pg_temp.ts_text(a.aired_from),
   pg_temp.ts_text(sa.aired_from), NULL)
) AS f (field, stored, previous_value, anilist_value, offline_value);

-- Fill: the stored value is empty; AniList first, the offline-db where AniList has none.
-- status is never empty and not filled; offline episodes only count for finished entries
-- (an ongoing entry reports the episodes aired so far).
CREATE TEMP TABLE field_plan AS
SELECT anime_id, field, 'fill' AS action, previous_value,
  coalesce(anilist_value, CASE WHEN field <> 'episodes'
    OR offline_status = 'Finished Airing' THEN offline_value END) AS new_value
FROM field_candidates
WHERE stored IS NULL AND field <> 'status'
  AND coalesce(anilist_value, CASE WHEN field <> 'episodes'
    OR offline_status = 'Finished Airing' THEN offline_value END) IS NOT NULL;

-- Majority: both sources hold the same value and it differs from the stored one.
-- Airing / not-yet-aired anime keep their episodes and status (they move over time). The
-- offline-db has no MUSIC type (it files music as SPECIAL), so it cannot outvote 'Music'.
CREATE TEMP TABLE majority_excluded AS
SELECT anime_id, field, previous_value, anilist_value AS new_value,
  CASE WHEN field IN ('episodes', 'status')
         AND stored_status IS DISTINCT FROM 'Finished Airing' THEN 'stored airing'
       WHEN field = 'episodes' AND (anilist_status IS DISTINCT FROM 'Finished Airing'
         OR offline_status IS DISTINCT FROM 'Finished Airing') THEN 'source airing'
       WHEN field = 'type' AND stored = 'Music' THEN 'offline-db has no Music type'
  END AS reason
FROM field_candidates
WHERE field IN ('episodes', 'year', 'season', 'type', 'status') AND stored IS NOT NULL
  AND anilist_value = offline_value AND anilist_value <> stored;

INSERT INTO field_plan
SELECT anime_id, field, 'majority', previous_value, new_value
FROM majority_excluded WHERE reason IS NULL;
DELETE FROM majority_excluded WHERE reason IS NULL;

-- AniList anime → anime edges, typed, both ends in the catalog, not stored yet (exact
-- (anime, related, type)); existing relations are never touched.
CREATE TEMP TABLE relation_plan AS
SELECT DISTINCT ON (e.anime_id, e.related_anime_id, v.app_value)
  e.anime_id, v.app_value AS relation_type, e.related_anime_id, e.anilist_type,
  EXISTS (SELECT 1 FROM anime_relation r WHERE r.anime_id = e.anime_id
          AND r.related_anime_id = e.related_anime_id) AS pair_known
FROM anilist_edges e
JOIN vocab v ON (v.kind, v.source, v.source_value) = ('relation', 'anilist', e.anilist_type)
WHERE e.node_type = 'ANIME' AND e.anime_id <> e.related_anime_id
  AND EXISTS (SELECT 1 FROM anime a WHERE a.mal_id = e.anime_id)
  AND EXISTS (SELECT 1 FROM anime a WHERE a.mal_id = e.related_anime_id)
  AND NOT EXISTS (SELECT 1 FROM anime_relation r WHERE r.anime_id = e.anime_id
    AND r.related_anime_id = e.related_anime_id AND r.relation_type = v.app_value)
ORDER BY e.anime_id, e.related_anime_id, v.app_value, e.anilist_type;

-- offline-db relatedAnime pairs with no type: reported, never inserted. Only pairs with
-- both ends in the catalog and no stored or planned relation of any type.
CREATE TEMP TABLE offline_untyped AS
SELECT o.anime_id, o.related_anime_id
FROM offline_related o
WHERE o.anime_id <> o.related_anime_id
  AND EXISTS (SELECT 1 FROM anime a WHERE a.mal_id = o.anime_id)
  AND EXISTS (SELECT 1 FROM anime a WHERE a.mal_id = o.related_anime_id)
  AND NOT EXISTS (SELECT 1 FROM anime_relation r WHERE r.anime_id = o.anime_id
                  AND r.related_anime_id = o.related_anime_id)
  AND NOT EXISTS (SELECT 1 FROM relation_plan p WHERE p.anime_id = o.anime_id
                  AND p.related_anime_id = o.related_anime_id);

-- Source values with no app value (skipped). Rows: AniList entries / offline (entry, MAL
-- id) rows / anime → anime edges.
CREATE TEMP TABLE unmapped_vocab AS
SELECT kind, source, value, count(*) AS rows
FROM (
  SELECT 'type' AS kind, 'anilist' AS source, format AS value FROM anilist_rows
  UNION ALL SELECT 'status', 'anilist', status FROM anilist_rows
  UNION ALL SELECT 'season', 'anilist', season FROM anilist_rows
  UNION ALL SELECT 'type', 'offline', j ->> 'type' FROM offline_rows
  UNION ALL SELECT 'status', 'offline', j ->> 'status' FROM offline_rows
  UNION ALL SELECT 'season', 'offline', j -> 'animeSeason' ->> 'season' FROM offline_rows
  UNION ALL SELECT 'relation', 'anilist', anilist_type FROM anilist_edges
    WHERE node_type = 'ANIME'
) s
WHERE value IS NOT NULL AND NOT EXISTS (SELECT 1 FROM vocab v
  WHERE (v.kind, v.source, v.source_value) = (s.kind, s.source, s.value))
GROUP BY kind, source, value;
