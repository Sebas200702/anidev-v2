-- audit: dry run of 04-apply.sql. Builds the plan (02-plan.sql) in a transaction that is
-- rolled back, and prints the counts per kind and status plus 5 examples per kind. No
-- table is written. Needs the manga cast staging (psql variable relink_schema, default
-- manga_cast_relink).
\if :{?relink_schema}
\else
\set relink_schema manga_cast_relink
\endif
SELECT to_regclass(:'relink_schema' || '.manga_cast') IS NOT NULL
  AND to_regprocedure(:'relink_schema' || '.norm_name(text)') IS NOT NULL
  AS has_staging \gset
\if :has_staging
BEGIN;
\ir 02-plan.sql

\qecho 'Kind A: UPPERCASE manga_character rows to remove'
SELECT CASE WHEN via_merge THEN 'remove (after B merge)' ELSE 'remove' END AS status,
  count(*) AS uppercase_rows, count(DISTINCT (manga_id, target_id)) AS links,
  count(DISTINCT manga_id) AS mangas
FROM a_row GROUP BY 1 ORDER BY 1;

\qecho 'Kind B: (R, S) pairs by status'
SELECT status, count(*) AS pairs, count(DISTINCT real_id) AS real_characters,
  count(DISTINCT synthetic_id) AS synthetic_characters
FROM b_pair GROUP BY 1 ORDER BY 1;

\qecho 'Kind B rows that would move to R (manga_character / anime_character)'
SELECT
  (SELECT count(*) FROM manga_character m JOIN b_pair p
     ON p.synthetic_id = m.character_id AND p.status = 'merge') AS manga_character,
  (SELECT count(*) FROM anime_character a JOIN b_pair p
     ON p.synthetic_id = a.character_id AND p.status = 'merge') AS anime_character;

\qecho 'Examples, kind A (5)'
SELECT a.manga_id, a.target_id AS character_id, c.name, a.role AS removed_role,
  a.via_merge,
  (SELECT string_agg(t.role, ',') FROM manga_character t
   WHERE t.manga_id = a.manga_id AND t.character_id = a.target_id
     AND t.role <> upper(t.role)) AS kept_role
FROM a_row a JOIN "character" c ON c.mal_id = a.target_id
ORDER BY a.manga_id, a.target_id LIMIT 5;

\qecho 'Examples, kind B merge (5) and left alone (5)'
(SELECT p.status, p.real_id, r.name AS real_name, p.synthetic_id, s.name AS synthetic_name,
   e.anilist_id AS real_anilist_id
 FROM b_pair p JOIN "character" r ON r.mal_id = p.real_id
 JOIN "character" s ON s.mal_id = p.synthetic_id
 LEFT JOIN character_external e ON e.character_id = p.real_id
 WHERE p.status = 'merge' ORDER BY p.real_id LIMIT 5)
UNION ALL
(SELECT p.status, p.real_id, r.name, p.synthetic_id, s.name, e.anilist_id
 FROM b_pair p JOIN "character" r ON r.mal_id = p.real_id
 JOIN "character" s ON s.mal_id = p.synthetic_id
 LEFT JOIN character_external e ON e.character_id = p.real_id
 WHERE p.status <> 'merge' ORDER BY p.status, p.real_id LIMIT 5);

ROLLBACK;
\else
DO $$ BEGIN
  RAISE EXCEPTION 'manga-cast-dedupe: manga cast staging is absent (needs '
    'manga_cast_relink.manga_cast and norm_name); load it with '
    'scripts/db/manga-cast-relink/run.sh first';
END $$;
\endif
