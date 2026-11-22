-- apply: fills placeholder name_kanji with the AniList native and inserts AniList posters,
-- in ONE transaction, logging everything for 05-rollback.sql. Refused while applied.
SELECT EXISTS (SELECT 1 FROM applied) OR EXISTS (SELECT 1 FROM kanji_updates)
  OR EXISTS (SELECT 1 FROM inserted_posters) AS is_applied \gset
\if :is_applied
DO $$ BEGIN
  RAISE EXCEPTION 'character-fill: already applied; run rollback first';
END $$;
\else
BEGIN;

\ir 02-plan.sql

INSERT INTO applied VALUES (now());

INSERT INTO kanji_conflicts (character_id, anilist_id, natives)
SELECT character_id, anilist_id, natives FROM kanji_plan WHERE decision = 'conflict';

-- Only placeholders change: the WHERE re-checks the value read by the plan.
WITH updated AS (
  UPDATE "character" c SET name_kanji = p.natives[1]
  FROM kanji_plan p
  WHERE p.decision = 'fill' AND c.mal_id = p.character_id
    AND c.name_kanji IS NOT DISTINCT FROM p.previous_kanji
  RETURNING c.mal_id, p.anilist_id, p.previous_kanji, c.name_kanji
)
INSERT INTO kanji_updates (character_id, anilist_id, previous_kanji, new_kanji)
SELECT * FROM updated;

-- Priority 30 ranks after the MAL posters (20/25), so a MAL image added later wins;
-- size NULL like the MAL rows (same values as scripts/db/cast-relink).
WITH inserted AS (
  INSERT INTO character_media (character_id, media_type, src, size, source, priority)
  SELECT character_id, 'poster', image_url, NULL, 'anilist', 30 FROM poster_plan
  ON CONFLICT DO NOTHING
  RETURNING id, character_id
)
INSERT INTO inserted_posters (id, character_id) SELECT * FROM inserted;

COMMIT;
\endif
