-- merge-twins: merges each synthetic character (1e9 + AniList id X) into the only real
-- character whose character_external.anilist_id is X (from character.anilist_id or the
-- anime casts, see 02-backfill.sql), in ONE transaction. Its anime_character,
-- manga_character, character_voice_actor, character_nickname and character_media rows move
-- to the real character; a row whose key the real character already holds is skipped and
-- deleted; then the synthetic "character" (and its character_external row) is deleted.
-- Every moved, skipped and deleted row is logged for 04-rollback.sql. Needs a backfill;
-- refused while a merge is applied.
SELECT NOT EXISTS (SELECT 1 FROM backfilled) AS needs_backfill,
  EXISTS (SELECT 1 FROM merge_pairs) AS has_merge \gset
\if :needs_backfill
DO $$ BEGIN RAISE EXCEPTION 'character-external: run backfill first'; END $$;
\elif :has_merge
DO $$ BEGIN
  RAISE EXCEPTION 'character-external: twins are already merged; run rollback first';
END $$;
\else
BEGIN;

-- anilist_id is unique in character_external, so a twin has one real candidate at most.
INSERT INTO merge_pairs (synthetic_id, real_id)
SELECT s.mal_id, e.character_id
FROM "character" s
JOIN character_external e
  ON e.anilist_id = s.mal_id - 1000000000 AND e.character_id < 1000000000
WHERE s.mal_id >= 1000000000;

\ir 03-merge-moves.sql

INSERT INTO deleted_externals
SELECT e.* FROM character_external e JOIN merge_pairs p ON p.synthetic_id = e.character_id;
INSERT INTO deleted_characters
SELECT c.* FROM "character" c JOIN merge_pairs p ON p.synthetic_id = c.mal_id;
-- Nothing references the synthetic rows any more, so this cascades only character_external.
DELETE FROM "character" c USING merge_pairs p WHERE p.synthetic_id = c.mal_id;

COMMIT;
\endif
