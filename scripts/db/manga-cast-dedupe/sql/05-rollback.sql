-- rollback: undoes the LAST batch of 04-apply.sql in ONE transaction and deletes its logs
-- (run again for the batch before it). Restores manga_character, anime_character,
-- "character", character_external, character_voice_actor, character_nickname and
-- character_media exactly. Refused, writing nothing, on drift: a row the batch moved to R
-- is gone or changed, R's character_external row no longer holds what the batch set, a
-- deleted synthetic id or a removed link was written again by someone else.
BEGIN;
SET LOCAL lock_timeout = '10s';
LOCK TABLE batches IN EXCLUSIVE MODE;
LOCK TABLE manga_character, anime_character, "character", character_external,
  character_voice_actor, character_nickname, character_media IN SHARE ROW EXCLUSIVE MODE;
SELECT coalesce(max(batch_id), 0) AS batch_id FROM batches \gset
SELECT CASE
  WHEN :batch_id = 0 THEN 'no batch to roll back'
  WHEN EXISTS (
    SELECT 1 FROM updated_externals u WHERE u.batch_id = :batch_id AND NOT EXISTS (
      SELECT 1 FROM character_external e
      WHERE e.character_id = u.character_id AND e.anilist_id = u.anilist_id))
  THEN format('character_external of %s changed since the apply', (
    SELECT min(u.character_id) FROM updated_externals u WHERE u.batch_id = :batch_id
      AND NOT EXISTS (SELECT 1 FROM character_external e
        WHERE e.character_id = u.character_id AND e.anilist_id = u.anilist_id)))
  WHEN EXISTS (
    SELECT 1 FROM deleted_characters d JOIN "character" c ON c.mal_id = d.mal_id
    WHERE d.batch_id = :batch_id)
  THEN 'a merged synthetic character exists again'
  WHEN EXISTS (
    SELECT 1 FROM moved_manga_character m WHERE m.batch_id = :batch_id
      AND NOT EXISTS (SELECT 1 FROM manga_character t
        WHERE (t.manga_id, t.character_id, t.role) = (m.manga_id, m.real_id, m.role))
      AND NOT EXISTS (SELECT 1 FROM removed_links r WHERE r.batch_id = :batch_id
        AND (r.manga_id, r.character_id, r.role) = (m.manga_id, m.real_id, m.role)))
  THEN 'a moved manga_character row changed since the apply'
  WHEN EXISTS (
    SELECT 1 FROM moved_anime_character m WHERE m.batch_id = :batch_id
      AND NOT EXISTS (SELECT 1 FROM anime_character t
        WHERE (t.anime_id, t.character_id, t.role) = (m.anime_id, m.real_id, m.role)))
  THEN 'a moved anime_character row changed since the apply'
  WHEN EXISTS (
    SELECT 1 FROM moved_character_voice_actor m WHERE m.batch_id = :batch_id
      AND NOT EXISTS (SELECT 1 FROM character_voice_actor t
        WHERE (t.character_id, t.staff_id, t.language) = (m.real_id, m.staff_id, m.language)))
  THEN 'a moved character_voice_actor row changed since the apply'
  WHEN EXISTS (
    SELECT 1 FROM moved_character_nickname m WHERE m.batch_id = :batch_id
      AND NOT EXISTS (SELECT 1 FROM character_nickname t
        WHERE t.id = m.id AND t.character_id = m.real_id))
  THEN 'a moved character_nickname row changed since the apply'
  WHEN EXISTS (
    SELECT 1 FROM moved_character_media m WHERE m.batch_id = :batch_id
      AND NOT EXISTS (SELECT 1 FROM character_media t
        WHERE t.id = m.id AND t.character_id = m.real_id))
  THEN 'a moved character_media row changed since the apply'
  WHEN EXISTS (
    SELECT 1 FROM removed_links r JOIN manga_character t
      ON (t.manga_id, t.character_id, t.role) = (r.manga_id, r.character_id, r.role)
    WHERE r.batch_id = :batch_id)
  THEN 'a removed manga_character row was written again'
  ELSE '' END AS drift \gset
SELECT :'drift' <> '' AS has_drift \gset
\if :has_drift
ROLLBACK;
SELECT set_config('manga_cast_dedupe.drift', :'drift', false) \g /dev/null
DO $$ BEGIN
  RAISE EXCEPTION 'manga-cast-dedupe: rollback refused: %',
    current_setting('manga_cast_dedupe.drift');
END $$;
\else
-- Reverse order of 04-apply.sql: A, then R's external, then S and its moved rows.
INSERT INTO manga_character (manga_id, character_id, role)
SELECT manga_id, character_id, role FROM removed_links WHERE batch_id = :batch_id;

INSERT INTO "character"
SELECT (jsonb_populate_record(NULL::"character", to_jsonb(d))).*
FROM deleted_characters d WHERE d.batch_id = :batch_id;
UPDATE character_external e
SET anilist_id = u.previous_anilist_id, updated_at = u.previous_updated_at
FROM updated_externals u WHERE u.character_id = e.character_id AND u.batch_id = :batch_id;
INSERT INTO character_external
SELECT (jsonb_populate_record(NULL::character_external, to_jsonb(d))).*
FROM deleted_externals d WHERE d.batch_id = :batch_id;

UPDATE anime_character t SET character_id = m.synthetic_id FROM moved_anime_character m
WHERE m.batch_id = :batch_id
  AND (t.anime_id, t.character_id, t.role) = (m.anime_id, m.real_id, m.role);
INSERT INTO anime_character SELECT (jsonb_populate_record(NULL::anime_character,
  to_jsonb(s))).* FROM skipped_anime_character s WHERE s.batch_id = :batch_id;

UPDATE manga_character t SET character_id = m.synthetic_id FROM moved_manga_character m
WHERE m.batch_id = :batch_id
  AND (t.manga_id, t.character_id, t.role) = (m.manga_id, m.real_id, m.role);
INSERT INTO manga_character SELECT (jsonb_populate_record(NULL::manga_character,
  to_jsonb(s))).* FROM skipped_manga_character s WHERE s.batch_id = :batch_id;

UPDATE character_voice_actor t SET character_id = m.synthetic_id
FROM moved_character_voice_actor m WHERE m.batch_id = :batch_id
  AND (t.character_id, t.staff_id, t.language) = (m.real_id, m.staff_id, m.language);
INSERT INTO character_voice_actor SELECT (jsonb_populate_record(
  NULL::character_voice_actor, to_jsonb(s))).*
FROM skipped_character_voice_actor s WHERE s.batch_id = :batch_id;

UPDATE character_nickname t SET character_id = m.synthetic_id
FROM moved_character_nickname m
WHERE m.batch_id = :batch_id AND t.id = m.id AND t.character_id = m.real_id;
INSERT INTO character_nickname SELECT (jsonb_populate_record(NULL::character_nickname,
  to_jsonb(s))).* FROM skipped_character_nickname s WHERE s.batch_id = :batch_id;

UPDATE character_media t SET character_id = m.synthetic_id FROM moved_character_media m
WHERE m.batch_id = :batch_id AND t.id = m.id AND t.character_id = m.real_id;
INSERT INTO character_media SELECT (jsonb_populate_record(NULL::character_media,
  to_jsonb(s))).* FROM skipped_character_media s WHERE s.batch_id = :batch_id;

DELETE FROM removed_links WHERE batch_id = :batch_id;
DELETE FROM merged_pairs WHERE batch_id = :batch_id;
DELETE FROM updated_externals WHERE batch_id = :batch_id;
DELETE FROM deleted_characters WHERE batch_id = :batch_id;
DELETE FROM deleted_externals WHERE batch_id = :batch_id;
DELETE FROM moved_anime_character WHERE batch_id = :batch_id;
DELETE FROM moved_manga_character WHERE batch_id = :batch_id;
DELETE FROM moved_character_voice_actor WHERE batch_id = :batch_id;
DELETE FROM moved_character_nickname WHERE batch_id = :batch_id;
DELETE FROM moved_character_media WHERE batch_id = :batch_id;
DELETE FROM skipped_anime_character WHERE batch_id = :batch_id;
DELETE FROM skipped_manga_character WHERE batch_id = :batch_id;
DELETE FROM skipped_character_voice_actor WHERE batch_id = :batch_id;
DELETE FROM skipped_character_nickname WHERE batch_id = :batch_id;
DELETE FROM skipped_character_media WHERE batch_id = :batch_id;
DELETE FROM batches WHERE batch_id = :batch_id;
COMMIT;
\endif
