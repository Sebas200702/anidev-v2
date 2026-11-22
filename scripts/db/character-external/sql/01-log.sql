-- Log tables of the backfill and twin merge, in the run schema (character_external_ops).
-- 04-rollback.sql reads them to restore the exact previous state. Copies of whole rows use
-- LIKE, so they follow the public table columns (in tests, the shadow copies).

-- backfill: character_external rows it inserted, and the AniList ids it withheld or flagged.
-- id_source: where the stored anilist_id came from ('character' = character.anilist_id,
-- 'cast' = derived from the anime casts, 'synthetic' = 1e9 + id); NULL when none is stored.
CREATE TABLE IF NOT EXISTS backfilled (character_id integer PRIMARY KEY);
ALTER TABLE backfilled ADD COLUMN IF NOT EXISTS id_source text
  CHECK (id_source IN ('character', 'cast', 'synthetic'));
-- reason 'shared-anilist': several real characters claim the id, all get anilist_id NULL;
-- 'cast-disagrees': the cast derives another id (anilist_id) than character.anilist_id,
-- which is kept; 'twin-pending-merge': synthetic twin of one real character, NULL until
-- merge-twins deletes it; 'ambiguous-twin': synthetic whose id several real characters
-- claim — it keeps anilist_id and is not merged. A character may carry several reasons.
CREATE TABLE IF NOT EXISTS conflicts (
  character_id integer NOT NULL, anilist_id integer NOT NULL, reason text NOT NULL,
  PRIMARY KEY (character_id, reason)
);
ALTER TABLE conflicts DROP CONSTRAINT IF EXISTS conflicts_reason_check,
  ADD CONSTRAINT conflicts_reason_check CHECK (reason IN ('shared-anilist',
    'cast-disagrees', 'twin-pending-merge', 'ambiguous-twin'));
-- Upgrades a log created before 'cast-disagrees' (key was character_id alone).
DO $$ BEGIN
  IF (SELECT cardinality(conkey) FROM pg_constraint
      WHERE conrelid = 'conflicts'::regclass AND contype = 'p') = 1 THEN
    ALTER TABLE conflicts DROP CONSTRAINT conflicts_pkey,
      ADD PRIMARY KEY (character_id, reason);
  END IF;
END $$;

-- merge-twins: one row per synthetic character merged into its real twin.
CREATE TABLE IF NOT EXISTS merge_pairs (
  synthetic_id integer PRIMARY KEY, real_id integer NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS deleted_characters (LIKE "character");
CREATE TABLE IF NOT EXISTS deleted_externals (LIKE character_external);

-- Moved rows: the key that now holds real_id (it held synthetic_id before).
CREATE TABLE IF NOT EXISTS moved_anime_character (
  anime_id integer NOT NULL, role text NOT NULL,
  synthetic_id integer NOT NULL, real_id integer NOT NULL
);
CREATE TABLE IF NOT EXISTS moved_manga_character (
  manga_id integer NOT NULL, role text NOT NULL,
  synthetic_id integer NOT NULL, real_id integer NOT NULL
);
CREATE TABLE IF NOT EXISTS moved_character_voice_actor (
  staff_id integer NOT NULL, language text NOT NULL,
  synthetic_id integer NOT NULL, real_id integer NOT NULL
);
CREATE TABLE IF NOT EXISTS moved_character_nickname (
  id integer PRIMARY KEY, synthetic_id integer NOT NULL, real_id integer NOT NULL
);
CREATE TABLE IF NOT EXISTS moved_character_media (
  id integer PRIMARY KEY, synthetic_id integer NOT NULL, real_id integer NOT NULL
);

-- Skipped rows: the real twin already held the same key, so the synthetic copy was
-- deleted; stored whole (ids included) for the rollback.
CREATE TABLE IF NOT EXISTS skipped_anime_character (LIKE anime_character);
CREATE TABLE IF NOT EXISTS skipped_manga_character (LIKE manga_character);
CREATE TABLE IF NOT EXISTS skipped_character_voice_actor (LIKE character_voice_actor);
CREATE TABLE IF NOT EXISTS skipped_character_nickname (LIKE character_nickname);
CREATE TABLE IF NOT EXISTS skipped_character_media (LIKE character_media);
