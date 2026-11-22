-- rollback: reverses the batch logged by 04-apply.sql in ONE transaction and empties the
-- logs, restoring manga_character, "character", character_external and character_media.
-- Refuses when a created character is referenced by a row the batch did not write (a
-- manga link it did not insert, a media row it did not create, or any anime link, voice
-- actor or nickname), since deleting the character would cascade that row away.
SELECT coalesce((
  SELECT c.mal_id FROM created_characters c
  WHERE EXISTS (
    SELECT 1 FROM manga_character mc
    WHERE mc.character_id = c.mal_id
      AND NOT EXISTS (
        SELECT 1 FROM inserted_links i
        WHERE (i.manga_id, i.character_id, i.role) = (mc.manga_id, mc.character_id, mc.role)
      )
  ) OR EXISTS (
    SELECT 1 FROM character_media m
    WHERE m.character_id = c.mal_id
      AND NOT EXISTS (SELECT 1 FROM created_media cm WHERE cm.id = m.id)
  )
  OR EXISTS (SELECT 1 FROM anime_character ac WHERE ac.character_id = c.mal_id)
  OR EXISTS (SELECT 1 FROM character_voice_actor v WHERE v.character_id = c.mal_id)
  OR EXISTS (SELECT 1 FROM character_nickname n WHERE n.character_id = c.mal_id)
  ORDER BY c.mal_id LIMIT 1
), 0) AS referenced \gset
SELECT :referenced <> 0 AS is_referenced \gset
\if :is_referenced
SELECT set_config('manga_cast_relink.referenced', :'referenced', false) \g /dev/null
DO $$ BEGIN
  RAISE EXCEPTION
    'manga-cast-relink: created character % is referenced by rows outside the batch',
    current_setting('manga_cast_relink.referenced');
END $$;
\else
BEGIN;

DELETE FROM manga_character mc
USING inserted_links i
WHERE (mc.manga_id, mc.character_id, mc.role) = (i.manga_id, i.character_id, i.role);

DELETE FROM character_media m USING created_media cm WHERE m.id = cm.id;

DELETE FROM character_external e USING created_characters c
WHERE e.character_id = c.mal_id;

DELETE FROM "character" ch USING created_characters c WHERE ch.mal_id = c.mal_id;

INSERT INTO manga_character (manga_id, character_id, role)
SELECT manga_id, character_id, role FROM removed_links
ON CONFLICT DO NOTHING;

TRUNCATE removed_links, inserted_links, created_characters, created_media;

COMMIT;
\endif
