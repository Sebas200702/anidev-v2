-- rollback: undoes merge-twins (when applied) and the backfill in ONE transaction, from the
-- logs, and empties them. Restores "character", character_external and the five tables
-- merge-twins touched to their exact state before the backfill. A key written by someone
-- else since then makes a statement fail and the whole transaction abort (nothing changes).
BEGIN;

-- merge-twins, in reverse: the synthetic rows come back first so the links can point to
-- them again.
INSERT INTO "character" SELECT * FROM deleted_characters;
INSERT INTO character_external SELECT * FROM deleted_externals;

UPDATE anime_character t SET character_id = m.synthetic_id FROM moved_anime_character m
WHERE (t.anime_id, t.character_id, t.role) = (m.anime_id, m.real_id, m.role);
INSERT INTO anime_character SELECT * FROM skipped_anime_character;

UPDATE manga_character t SET character_id = m.synthetic_id FROM moved_manga_character m
WHERE (t.manga_id, t.character_id, t.role) = (m.manga_id, m.real_id, m.role);
INSERT INTO manga_character SELECT * FROM skipped_manga_character;

UPDATE character_voice_actor t SET character_id = m.synthetic_id
FROM moved_character_voice_actor m
WHERE (t.character_id, t.staff_id, t.language) = (m.real_id, m.staff_id, m.language);
INSERT INTO character_voice_actor SELECT * FROM skipped_character_voice_actor;

UPDATE character_nickname t SET character_id = m.synthetic_id
FROM moved_character_nickname m WHERE t.id = m.id AND t.character_id = m.real_id;
INSERT INTO character_nickname SELECT * FROM skipped_character_nickname;

UPDATE character_media t SET character_id = m.synthetic_id
FROM moved_character_media m WHERE t.id = m.id AND t.character_id = m.real_id;
INSERT INTO character_media SELECT * FROM skipped_character_media;

-- backfill: its rows leave character_external (rows it did not insert stay).
DELETE FROM character_external e USING backfilled b WHERE e.character_id = b.character_id;

TRUNCATE backfilled, conflicts, merge_pairs, deleted_characters, deleted_externals,
  moved_anime_character, moved_manga_character, moved_character_voice_actor,
  moved_character_nickname, moved_character_media, skipped_anime_character,
  skipped_manga_character, skipped_character_voice_actor, skipped_character_nickname,
  skipped_character_media;

COMMIT;
