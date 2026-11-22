-- backfill: one character_external row per "character" row, in ONE transaction.
--   real (mal_id < 1e9)   → mal_id = character.mal_id, anilist_id = character.anilist_id,
--                           else the id derived from the anime casts (02-cast-ids.sql)
--   synthetic (>= 1e9)    → mal_id NULL, anilist_id = mal_id - 1e9
-- An AniList id claimed by several real characters (from either source) is withheld from
-- all of them ('shared-anilist'). A synthetic whose AniList id belongs to exactly one real
-- character is its twin: the real row keeps the id and the synthetic gets NULL until
-- merge-twins deletes it ('twin-pending-merge'). A synthetic whose id several real
-- characters claim keeps it and is never merged ('ambiguous-twin'). Needs the cast_relink
-- staging (psql variable cast_schema, default cast_relink); refused while a backfill is
-- applied.
\if :{?cast_schema}
\else
\set cast_schema cast_relink
\endif
SELECT EXISTS (SELECT 1 FROM backfilled) OR EXISTS (SELECT 1 FROM conflicts)
  AS has_backfill,
  to_regclass(:'cast_schema' || '.anilist_cast') IS NOT NULL
  AND to_regprocedure(:'cast_schema' || '.norm_name(text)') IS NOT NULL AS has_cast \gset
\if :has_backfill
DO $$ BEGIN
  RAISE EXCEPTION 'character-external: backfill is already applied; run rollback first';
END $$;
\elif :has_cast
BEGIN;

\ir 02-cast-ids.sql

WITH claims AS (SELECT anilist_id, count(*) AS reals FROM real_claim GROUP BY 1)
INSERT INTO conflicts (character_id, anilist_id, reason)
SELECT c.character_id, c.anilist_id, 'shared-anilist'
FROM real_claim c JOIN claims k ON k.anilist_id = c.anilist_id AND k.reals > 1
UNION ALL
SELECT s.mal_id, s.mal_id - 1000000000,
  CASE WHEN k.reals = 1 THEN 'twin-pending-merge' ELSE 'ambiguous-twin' END
FROM "character" s JOIN claims k ON k.anilist_id = s.mal_id - 1000000000
WHERE s.mal_id >= 1000000000;

WITH source_rows AS (
  SELECT c.mal_id AS character_id,
    CASE WHEN c.mal_id < 1000000000 THEN c.mal_id END AS mal_id,
    CASE
      WHEN EXISTS (SELECT 1 FROM conflicts f WHERE f.character_id = c.mal_id
                   AND f.reason IN ('shared-anilist', 'twin-pending-merge')) THEN NULL
      WHEN c.mal_id < 1000000000 THEN r.anilist_id
      ELSE c.mal_id - 1000000000
    END AS anilist_id,
    CASE WHEN c.mal_id < 1000000000 THEN r.source ELSE 'synthetic' END AS id_source
  FROM "character" c LEFT JOIN real_claim r ON r.character_id = c.mal_id
), inserted AS (
  INSERT INTO character_external (character_id, mal_id, anilist_id, anidb_id, created_at,
    updated_at)
  SELECT character_id, mal_id, anilist_id, NULL, now(), now() FROM source_rows
  ON CONFLICT (character_id) DO NOTHING
  RETURNING character_id, anilist_id
)
INSERT INTO backfilled (character_id, id_source)
SELECT i.character_id, CASE WHEN i.anilist_id IS NOT NULL THEN s.id_source END
FROM inserted i JOIN source_rows s ON s.character_id = i.character_id;

COMMIT;
\else
DO $$ BEGIN
  RAISE EXCEPTION 'character-external: cast_relink staging is absent (needs '
    'cast_relink.anilist_cast and cast_relink.norm_name); load it with '
    'scripts/db/cast-relink/run.sh first';
END $$;
\endif
