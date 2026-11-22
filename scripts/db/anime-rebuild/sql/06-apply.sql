-- apply: inserts the planned AniList relations and writes the planned field changes in
-- ONE transaction, logging everything for 07-rollback.sql. Refused while applied.
SELECT EXISTS (SELECT 1 FROM applied) OR EXISTS (SELECT 1 FROM field_updates)
  OR EXISTS (SELECT 1 FROM inserted_relations) AS is_applied \gset
\if :is_applied
DO $$ BEGIN
  RAISE EXCEPTION 'anime-rebuild: already applied; run rollback first';
END $$;
\else
BEGIN;

\ir 04-plan.sql

INSERT INTO applied VALUES (now());

-- Only new rows: the PRIMARY KEY conflict guard keeps existing relations untouched.
WITH inserted AS (
  INSERT INTO anime_relation (anime_id, relation_type, related_anime_id)
  SELECT anime_id, relation_type, related_anime_id FROM relation_plan
  ON CONFLICT DO NOTHING
  RETURNING anime_id, relation_type, related_anime_id
)
INSERT INTO inserted_relations (anime_id, relation_type, related_anime_id, anilist_type)
SELECT i.anime_id, i.relation_type, i.related_anime_id, p.anilist_type
FROM inserted i JOIN relation_plan p USING (anime_id, relation_type, related_anime_id);

-- One UPDATE per field (typed). The WHERE re-checks the value the plan read, so a row
-- changed meanwhile is neither written nor logged.
DO $$
DECLARE
  f record;
BEGIN
  FOR f IN SELECT * FROM (VALUES ('synopsis', 'text'), ('episodes', 'integer'),
    ('year', 'integer'), ('season', 'text'), ('type', 'text'), ('status', 'text'),
    ('aired_from', 'timestamptz')) AS t (field, cast_to)
  LOOP
    EXECUTE format($sql$
      WITH updated AS (
        UPDATE anime a SET %1$I = p.new_value::%2$s
        FROM field_plan p
        WHERE p.field = %1$L AND a.mal_id = p.anime_id
          AND a.%1$I IS NOT DISTINCT FROM p.previous_value::%2$s
        RETURNING p.anime_id, p.field, p.action, p.previous_value, p.new_value
      )
      INSERT INTO field_updates (anime_id, field, action, previous_value, new_value)
      SELECT * FROM updated$sql$, f.field, f.cast_to);
  END LOOP;
END $$;

COMMIT;
\endif
