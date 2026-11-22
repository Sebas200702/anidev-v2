-- rollback: undoes the apply in ONE transaction, from the logs, and empties them. Restores
-- every logged anime value and deletes the inserted relations. A logged value changed
-- since the apply aborts the whole rollback (nothing changes).
BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.field_casts() RETURNS TABLE (field text, cast_to text)
LANGUAGE sql IMMUTABLE AS $$
  VALUES ('synopsis', 'text'), ('episodes', 'integer'), ('year', 'integer'),
    ('season', 'text'), ('type', 'text'), ('status', 'text'), ('aired_from', 'timestamptz')
$$;

-- Typed comparison: '2005-10-02 00:00:00+00' equals the stored timestamptz in any zone.
CREATE OR REPLACE FUNCTION pg_temp.has_drift() RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE
  f record;
  found_drift boolean;
BEGIN
  FOR f IN SELECT * FROM pg_temp.field_casts() LOOP
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM field_updates u
      JOIN anime a ON a.mal_id = u.anime_id
      WHERE u.field = %1$L AND a.%1$I IS DISTINCT FROM u.new_value::%2$s)',
      f.field, f.cast_to) INTO found_drift;
    IF found_drift THEN RETURN true; END IF;
  END LOOP;
  -- A logged anime that no longer exists cannot be restored either.
  RETURN EXISTS (SELECT 1 FROM field_updates u
                 WHERE NOT EXISTS (SELECT 1 FROM anime a WHERE a.mal_id = u.anime_id));
END $$;

SELECT pg_temp.has_drift() AS has_drift \gset
\if :has_drift
ROLLBACK;
DO $$ BEGIN
  RAISE EXCEPTION 'anime-rebuild: anime values changed since apply; rollback aborted';
END $$;
\else
DO $$
DECLARE
  f record;
BEGIN
  FOR f IN SELECT * FROM pg_temp.field_casts() LOOP
    EXECUTE format('UPDATE anime a SET %1$I = u.previous_value::%2$s
      FROM field_updates u WHERE u.field = %1$L AND a.mal_id = u.anime_id',
      f.field, f.cast_to);
  END LOOP;
END $$;

DELETE FROM anime_relation r USING inserted_relations i
WHERE (r.anime_id, r.relation_type, r.related_anime_id)
  = (i.anime_id, i.relation_type, i.related_anime_id);

TRUNCATE applied, field_updates, inserted_relations;

COMMIT;
\endif
