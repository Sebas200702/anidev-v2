-- merge-api: projects api_raw (one JSON line per MAL manga id from fetch-anilist.ts
-- --type MANGA) into manga_cast and manga_cast_source. Per manga the latest found line
-- wins, else the latest line (error or not found). Rebuilt from scratch: idempotent.
BEGIN;

TRUNCATE manga_cast, manga_cast_source;

CREATE TEMP TABLE api_rows ON COMMIT DROP AS
SELECT DISTINCT ON (manga_id) manga_id, found, error, edges
FROM (
  SELECT r.seq, (j ->> 'anime_id')::integer AS manga_id,
    coalesce((j ->> 'found')::boolean, false) AS found,
    j ->> 'error' AS error,
    CASE WHEN jsonb_typeof(j -> 'edges') = 'array' THEN j -> 'edges' ELSE '[]' END AS edges
  FROM api_raw r
  CROSS JOIN LATERAL (SELECT r.line::jsonb AS j) parsed
  WHERE btrim(coalesce(r.line, '')) <> ''
) lines
WHERE manga_id IS NOT NULL
ORDER BY manga_id, found DESC, seq DESC;

INSERT INTO manga_cast (manga_id, anilist_character_id, role, name_full, name_native,
                        image_url, name_keys)
SELECT DISTINCT ON (a.manga_id, (e -> 'node' ->> 'id')::integer)
  a.manga_id,
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
WHERE a.found AND e -> 'node' ->> 'id' IS NOT NULL
ORDER BY a.manga_id, (e -> 'node' ->> 'id')::integer;

INSERT INTO manga_cast_source (manga_id, status, cast_size, error)
SELECT a.manga_id,
  CASE WHEN a.found THEN 'found' WHEN a.error IS NOT NULL THEN 'error' ELSE 'not-found' END,
  (SELECT count(*) FROM manga_cast c WHERE c.manga_id = a.manga_id),
  CASE WHEN NOT a.found THEN a.error END
FROM api_rows a;

ANALYZE manga_cast;

COMMIT;
