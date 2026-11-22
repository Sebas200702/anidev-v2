-- T3: merges the AniList API casts (anilist_api_raw, one JSON line per MAL anime id) into
-- staging. For every found anime its anilist_cast rows are replaced and its
-- anilist_cast_source row becomes (real cast size, 'anilist-api'); not-found or errored
-- animes are left untouched. Idempotent: the same raw input gives the same staging.
BEGIN;

CREATE TEMP TABLE api_rows ON COMMIT DROP AS
SELECT DISTINCT ON (anime_id) anime_id, edges
FROM (
  SELECT r.seq, (j ->> 'anime_id')::integer AS anime_id,
    coalesce((j ->> 'found')::boolean, false) AS found,
    CASE WHEN jsonb_typeof(j -> 'edges') = 'array' THEN j -> 'edges' ELSE '[]' END AS edges
  FROM anilist_api_raw r
  CROSS JOIN LATERAL (SELECT r.line::jsonb AS j) parsed
  WHERE btrim(coalesce(r.line, '')) <> ''
) lines
WHERE found AND anime_id IS NOT NULL
ORDER BY anime_id, seq DESC;

DELETE FROM anilist_cast c USING api_rows a WHERE c.anime_id = a.anime_id;

INSERT INTO anilist_cast (anime_id, anilist_character_id, role, name_full, name_native,
                          image_url, name_keys)
SELECT DISTINCT ON (a.anime_id, (e -> 'node' ->> 'id')::integer)
  a.anime_id,
  (e -> 'node' ->> 'id')::integer,
  e ->> 'role',
  e -> 'node' -> 'name' ->> 'full',
  e -> 'node' -> 'name' ->> 'native',
  e -> 'node' -> 'image' ->> 'large',
  ARRAY(
    SELECT DISTINCT k FROM (
      SELECT norm_name(e -> 'node' -> 'name' ->> 'full') AS k
      UNION ALL
      SELECT norm_name(alt) FROM jsonb_array_elements_text(
        CASE WHEN jsonb_typeof(e -> 'node' -> 'name' -> 'alternative') = 'array'
          THEN e -> 'node' -> 'name' -> 'alternative' ELSE '[]' END) AS alt
    ) keys WHERE k IS NOT NULL
  )
FROM api_rows a
CROSS JOIN LATERAL jsonb_array_elements(a.edges) AS e
WHERE e -> 'node' ->> 'id' IS NOT NULL
ORDER BY a.anime_id, (e -> 'node' ->> 'id')::integer;

INSERT INTO anilist_cast_source (anime_id, cast_size, source)
SELECT a.anime_id,
  (SELECT count(*) FROM anilist_cast c WHERE c.anime_id = a.anime_id), 'anilist-api'
FROM api_rows a
ON CONFLICT (anime_id) DO UPDATE
SET cast_size = excluded.cast_size, source = excluded.source;

COMMIT;
