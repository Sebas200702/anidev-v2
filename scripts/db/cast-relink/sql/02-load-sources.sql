-- Projects the raw sources into the staging tables. Idempotent: reloads from scratch.
BEGIN;

TRUNCATE anilist_cast, anilist_cast_source, anime_anilist_map;

CREATE TEMP TABLE anilist_rows ON COMMIT DROP AS
SELECT
  floor(c03::numeric)::integer AS anime_id,
  CASE WHEN coalesce(c54, '') = '' THEN '[]'::jsonb ELSE c54::jsonb END AS edges
FROM anilist_raw
WHERE coalesce(c03, '') NOT IN ('', 'nan');

INSERT INTO anilist_cast_source (anime_id, cast_size, source)
SELECT anime_id, max(jsonb_array_length(edges)), 'kaggle-csv'
FROM anilist_rows
GROUP BY anime_id;

-- The same AniList character can appear under two AniList entries sharing an idMal.
INSERT INTO anilist_cast (anime_id, anilist_character_id, role, name_full, name_native,
                          image_url, name_keys)
SELECT DISTINCT ON (r.anime_id, (e -> 'node' ->> 'id')::integer)
  r.anime_id,
  (e -> 'node' ->> 'id')::integer,
  e ->> 'role',
  e -> 'node' -> 'name' ->> 'full',
  e -> 'node' -> 'name' ->> 'native',
  e -> 'node' -> 'image' ->> 'large',
  ARRAY(
    SELECT DISTINCT k FROM (
      SELECT norm_name(e -> 'node' -> 'name' ->> 'full') AS k
      UNION ALL
      SELECT norm_name(a) FROM jsonb_array_elements_text(
        coalesce(e -> 'node' -> 'name' -> 'alternative', '[]'::jsonb)) AS a
    ) keys WHERE k IS NOT NULL
  )
FROM anilist_rows r
CROSS JOIN LATERAL jsonb_array_elements(r.edges) AS e
WHERE e -> 'node' ->> 'id' IS NOT NULL
ORDER BY r.anime_id, (e -> 'node' ->> 'id')::integer;

INSERT INTO anime_anilist_map (mal_id, anilist_id)
SELECT DISTINCT ON (mal.id) mal.id, ani.id
FROM offline_db_raw r
CROSS JOIN LATERAL (SELECT r.line::jsonb -> 'sources' AS sources) j
CROSS JOIN LATERAL (
  SELECT (regexp_match(s, 'anilist\.co/anime/(\d+)'))[1]::integer AS id
  FROM jsonb_array_elements_text(j.sources) s
  WHERE s ~ 'anilist\.co/anime/\d+' LIMIT 1
) ani
CROSS JOIN LATERAL (
  SELECT (regexp_match(s, 'myanimelist\.net/anime/(\d+)'))[1]::integer AS id
  FROM jsonb_array_elements_text(j.sources) s
  WHERE s ~ 'myanimelist\.net/anime/\d+'
) mal
WHERE j.sources IS NOT NULL
ORDER BY mal.id, ani.id;

COMMIT;
