-- rollback: undoes the apply in ONE transaction, from the logs, and empties them. Restores
-- the replaced name_kanji values and deletes the inserted posters. A filled kanji changed by
-- someone since the apply aborts the whole rollback (nothing changes).
BEGIN;

SELECT EXISTS (
  SELECT 1 FROM kanji_updates k JOIN "character" c ON c.mal_id = k.character_id
  WHERE c.name_kanji IS DISTINCT FROM k.new_kanji
) AS has_drift \gset
\if :has_drift
ROLLBACK;
DO $$ BEGIN
  RAISE EXCEPTION 'character-fill: name_kanji changed since apply; rollback aborted';
END $$;
\else
UPDATE "character" c SET name_kanji = k.previous_kanji
FROM kanji_updates k WHERE c.mal_id = k.character_id;

DELETE FROM character_media m USING inserted_posters p WHERE m.id = p.id;

TRUNCATE applied, kanji_updates, kanji_conflicts, inserted_posters;

COMMIT;
\endif
