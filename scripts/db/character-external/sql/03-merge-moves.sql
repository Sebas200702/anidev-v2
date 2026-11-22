-- Included by 03-merge-twins.sql inside its transaction (merge_pairs is filled). For each
-- table: move the synthetic rows whose key the real twin does not hold yet, then log and
-- delete the remaining (duplicate) synthetic rows.

WITH moved AS (
  UPDATE anime_character t SET character_id = p.real_id FROM merge_pairs p
  WHERE t.character_id = p.synthetic_id AND NOT EXISTS (
    SELECT 1 FROM anime_character d
    WHERE (d.anime_id, d.character_id, d.role) = (t.anime_id, p.real_id, t.role))
  RETURNING t.anime_id, t.role, p.synthetic_id, p.real_id
)
INSERT INTO moved_anime_character SELECT * FROM moved;
WITH skipped AS (
  DELETE FROM anime_character t USING merge_pairs p WHERE t.character_id = p.synthetic_id
  RETURNING t.*
)
INSERT INTO skipped_anime_character SELECT * FROM skipped;

WITH moved AS (
  UPDATE manga_character t SET character_id = p.real_id FROM merge_pairs p
  WHERE t.character_id = p.synthetic_id AND NOT EXISTS (
    SELECT 1 FROM manga_character d
    WHERE (d.manga_id, d.character_id, d.role) = (t.manga_id, p.real_id, t.role))
  RETURNING t.manga_id, t.role, p.synthetic_id, p.real_id
)
INSERT INTO moved_manga_character SELECT * FROM moved;
WITH skipped AS (
  DELETE FROM manga_character t USING merge_pairs p WHERE t.character_id = p.synthetic_id
  RETURNING t.*
)
INSERT INTO skipped_manga_character SELECT * FROM skipped;

WITH moved AS (
  UPDATE character_voice_actor t SET character_id = p.real_id FROM merge_pairs p
  WHERE t.character_id = p.synthetic_id AND NOT EXISTS (
    SELECT 1 FROM character_voice_actor d
    WHERE (d.character_id, d.staff_id, d.language) = (p.real_id, t.staff_id, t.language))
  RETURNING t.staff_id, t.language, p.synthetic_id, p.real_id
)
INSERT INTO moved_character_voice_actor SELECT * FROM moved;
WITH skipped AS (
  DELETE FROM character_voice_actor t USING merge_pairs p
  WHERE t.character_id = p.synthetic_id
  RETURNING t.*
)
INSERT INTO skipped_character_voice_actor SELECT * FROM skipped;

WITH moved AS (
  UPDATE character_nickname t SET character_id = p.real_id FROM merge_pairs p
  WHERE t.character_id = p.synthetic_id AND NOT EXISTS (
    SELECT 1 FROM character_nickname d
    WHERE (d.character_id, d.nickname) = (p.real_id, t.nickname))
  RETURNING t.id, p.synthetic_id, p.real_id
)
INSERT INTO moved_character_nickname SELECT * FROM moved;
WITH skipped AS (
  DELETE FROM character_nickname t USING merge_pairs p WHERE t.character_id = p.synthetic_id
  RETURNING t.*
)
INSERT INTO skipped_character_nickname SELECT * FROM skipped;

WITH moved AS (
  UPDATE character_media t SET character_id = p.real_id FROM merge_pairs p
  WHERE t.character_id = p.synthetic_id AND NOT EXISTS (
    SELECT 1 FROM character_media d
    WHERE (d.character_id, d.media_type, d.src) = (p.real_id, t.media_type, t.src))
  RETURNING t.id, p.synthetic_id, p.real_id
)
INSERT INTO moved_character_media SELECT * FROM moved;
WITH skipped AS (
  DELETE FROM character_media t USING merge_pairs p WHERE t.character_id = p.synthetic_id
  RETURNING t.*
)
INSERT INTO skipped_character_media SELECT * FROM skipped;
