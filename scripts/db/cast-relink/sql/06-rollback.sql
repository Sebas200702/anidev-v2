-- T4: reverses the batch logged by 05-apply.sql in ONE transaction and empties the logs.
-- Touches only rows the batch logged: it refuses when a created character is referenced
-- by a link or media row the batch did not create, or by any other table that cascades
-- from "character" (the batch never writes those), since deleting it would cascade them.
SELECT coalesce((
  SELECT c.mal_id FROM created_characters c
  WHERE EXISTS (
    SELECT 1 FROM anime_character ac
    WHERE ac.character_id = c.mal_id
      AND NOT EXISTS (
        SELECT 1 FROM inserted_links i
        WHERE (i.anime_id, i.character_id, i.role) = (ac.anime_id, ac.character_id, ac.role)
      )
  ) OR EXISTS (
    SELECT 1 FROM character_media m
    WHERE m.character_id = c.mal_id
      AND NOT EXISTS (SELECT 1 FROM created_media cm WHERE cm.id = m.id)
  )
  OR EXISTS (SELECT 1 FROM character_voice_actor v WHERE v.character_id = c.mal_id)
  OR EXISTS (SELECT 1 FROM character_nickname n WHERE n.character_id = c.mal_id)
  OR EXISTS (SELECT 1 FROM manga_character mc WHERE mc.character_id = c.mal_id)
  ORDER BY c.mal_id LIMIT 1
), 0) AS referenced \gset
SELECT :referenced <> 0 AS is_referenced \gset
\if :is_referenced
SELECT set_config('cast_relink.referenced', :'referenced', false) \g /dev/null
DO $$ BEGIN
  RAISE EXCEPTION 'cast-relink: created character % is referenced by rows outside the batch',
    current_setting('cast_relink.referenced');
END $$;
\else
BEGIN;

DELETE FROM anime_character ac
USING inserted_links i
WHERE (ac.anime_id, ac.character_id, ac.role) = (i.anime_id, i.character_id, i.role);

DELETE FROM character_media m USING created_media cm WHERE m.id = cm.id;

DELETE FROM "character" c USING created_characters cc WHERE c.mal_id = cc.mal_id;

-- Restore only values the batch set and nobody changed since.
UPDATE "character" c SET anilist_id = u.previous_anilist_id
FROM updated_characters u
WHERE u.mal_id = c.mal_id AND u.status = 'set'
  AND c.anilist_id = u.candidate_anilist_ids[1];

INSERT INTO anime_character (anime_id, character_id, role)
SELECT anime_id, character_id, role FROM removed_links
ON CONFLICT DO NOTHING;

TRUNCATE removed_links, inserted_links, created_characters, created_media,
  updated_characters;

COMMIT;
\endif
