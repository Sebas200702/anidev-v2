-- apply: builds the plan (02-plan.sql) and applies it in ONE transaction as a new batch.
--   B: each 'merge' pair moves S's anime_character, manga_character,
--      character_voice_actor, character_nickname and character_media rows to R (the
--      moves of scripts/db/character-external/sql/03-merge-moves.sql; a row whose key R
--      already holds is skipped and deleted), deletes S with its character_external row
--      and sets R's character_external.anilist_id to X.
--   A: then every UPPERCASE manga_character row whose (manga, character) has a
--      Title-case row is removed (cast-relink 'dedupe' / 'jikan-same-pair'), and so is
--      every UPPERCASE anime_character row this batch moved to R next to a Title-case row.
-- Every changed row is logged with the batch id for 05-rollback.sql. The written tables
-- are locked against concurrent writers (a running load makes it fail after 10s). Guard:
-- a plan with nothing to do is refused, so applying twice never writes a second batch;
-- after more MAL rows arrive, a new apply only handles the new pairs.
\if :{?relink_schema}
\else
\set relink_schema manga_cast_relink
\endif
SELECT to_regclass(:'relink_schema' || '.manga_cast') IS NOT NULL
  AND to_regprocedure(:'relink_schema' || '.norm_name(text)') IS NOT NULL
  AS has_staging \gset
\if :has_staging
BEGIN;
SET LOCAL lock_timeout = '10s';
LOCK TABLE batches IN EXCLUSIVE MODE;
LOCK TABLE manga_character, anime_character, "character", character_external,
  character_voice_actor, character_nickname, character_media IN SHARE ROW EXCLUSIVE MODE;
\ir 02-plan.sql
SELECT EXISTS (SELECT 1 FROM a_row) OR EXISTS (SELECT 1 FROM b_pair WHERE status = 'merge')
  AS has_work \gset
\if :has_work
INSERT INTO batches DEFAULT VALUES RETURNING batch_id \gset
SELECT set_config('manga_cast_dedupe.batch_id', :'batch_id', true) \g /dev/null

-- B. Temp merge_pairs shadows nothing persistent: it is what 03-merge-moves.sql reads.
CREATE TEMP TABLE merge_pairs ON COMMIT DROP AS
SELECT synthetic_id, real_id FROM b_pair WHERE status = 'merge';
INSERT INTO merged_pairs (synthetic_id, real_id, anilist_id)
SELECT synthetic_id, real_id, anilist_id FROM b_pair WHERE status = 'merge';

\ir ../../character-external/sql/03-merge-moves.sql

INSERT INTO deleted_externals
SELECT e.* FROM character_external e JOIN merge_pairs p ON p.synthetic_id = e.character_id;
INSERT INTO deleted_characters
SELECT c.* FROM "character" c JOIN merge_pairs p ON p.synthetic_id = c.mal_id;
-- Nothing references S any more, so this cascades only its character_external row.
DELETE FROM "character" c USING merge_pairs p WHERE p.synthetic_id = c.mal_id;

-- X is free now (S held it); R gets it unless it already holds it.
INSERT INTO updated_externals (character_id, previous_anilist_id, previous_updated_at,
  anilist_id)
SELECT e.character_id, e.anilist_id, e.updated_at, p.anilist_id
FROM character_external e
JOIN merged_pairs p ON p.real_id = e.character_id AND p.batch_id = :batch_id
WHERE e.anilist_id IS DISTINCT FROM p.anilist_id;
UPDATE character_external e SET anilist_id = u.anilist_id, updated_at = now()
FROM updated_externals u
WHERE u.character_id = e.character_id AND u.batch_id = :batch_id;

-- A, after the merge.
WITH removed AS (
  DELETE FROM manga_character u
  WHERE u.role = upper(u.role) AND EXISTS (
    SELECT 1 FROM manga_character t
    WHERE t.manga_id = u.manga_id AND t.character_id = u.character_id
      AND t.role <> upper(t.role))
  RETURNING u.manga_id, u.character_id, u.role
)
INSERT INTO removed_links (manga_id, character_id, role, reason)
SELECT r.manga_id, r.character_id, r.role,
  CASE WHEN EXISTS (
    SELECT 1 FROM moved_manga_character m
    WHERE m.batch_id = :batch_id
      AND (m.manga_id, m.real_id, m.role) = (r.manga_id, r.character_id, r.role)
  ) THEN 'merged-pair' ELSE 'same-pair' END
FROM removed r;

-- A on anime_character: only rows this batch moved from S to R.
WITH removed AS (
  DELETE FROM anime_character u USING moved_anime_character m
  WHERE m.batch_id = :batch_id
    AND (u.anime_id, u.character_id, u.role) = (m.anime_id, m.real_id, m.role)
    AND u.role = upper(u.role) AND EXISTS (
      SELECT 1 FROM anime_character t
      WHERE t.anime_id = u.anime_id AND t.character_id = u.character_id
        AND t.role <> upper(t.role))
  RETURNING u.*
)
INSERT INTO removed_anime_links SELECT * FROM removed;

COMMIT;
\else
ROLLBACK;
DO $$ BEGIN
  RAISE EXCEPTION 'manga-cast-dedupe: nothing to apply (no kind A row and no kind B '
    'merge left; an applied batch is never applied twice)';
END $$;
\endif
\else
DO $$ BEGIN
  RAISE EXCEPTION 'manga-cast-dedupe: manga cast staging is absent (needs '
    'manga_cast_relink.manga_cast and norm_name); load it with '
    'scripts/db/manga-cast-relink/run.sh first';
END $$;
\endif
