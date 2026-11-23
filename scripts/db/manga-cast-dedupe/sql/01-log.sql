-- Log tables of the applied batches, in the run schema (manga_cast_dedupe). 05-rollback.sql
-- reads them to restore the exact state before the last batch. Every log row carries its
-- batch_id; the default reads the batch 04-apply.sql sets for its transaction, so the
-- merge moves of scripts/db/character-external (INSERT ... SELECT * without batch_id)
-- fill these tables unchanged. Whole-row copies use LIKE (in tests, the shadow copies).
CREATE TABLE IF NOT EXISTS batches (
  batch_id serial PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now()
);

-- Kind B: one row per synthetic S (1e9 + anilist_id) merged into the real character R.
CREATE TABLE IF NOT EXISTS merged_pairs (
  synthetic_id integer NOT NULL, real_id integer NOT NULL, anilist_id integer NOT NULL,
  batch_id integer NOT NULL
    DEFAULT current_setting('manga_cast_dedupe.batch_id')::integer,
  PRIMARY KEY (batch_id, synthetic_id)
);
-- R's character_external row before the batch set anilist_id (previous values).
CREATE TABLE IF NOT EXISTS updated_externals (
  character_id integer NOT NULL, previous_anilist_id integer,
  previous_updated_at timestamp NOT NULL, anilist_id integer NOT NULL,
  batch_id integer NOT NULL
    DEFAULT current_setting('manga_cast_dedupe.batch_id')::integer,
  PRIMARY KEY (batch_id, character_id)
);
CREATE TABLE IF NOT EXISTS deleted_characters (LIKE "character",
  batch_id integer NOT NULL DEFAULT current_setting('manga_cast_dedupe.batch_id')::integer);
CREATE TABLE IF NOT EXISTS deleted_externals (LIKE character_external,
  batch_id integer NOT NULL DEFAULT current_setting('manga_cast_dedupe.batch_id')::integer);

-- Moved rows (columns of character-external/sql/03-merge-moves.sql): the key that now
-- holds real_id (it held synthetic_id before).
CREATE TABLE IF NOT EXISTS moved_anime_character (
  anime_id integer NOT NULL, role text NOT NULL,
  synthetic_id integer NOT NULL, real_id integer NOT NULL,
  batch_id integer NOT NULL DEFAULT current_setting('manga_cast_dedupe.batch_id')::integer
);
CREATE TABLE IF NOT EXISTS moved_manga_character (
  manga_id integer NOT NULL, role text NOT NULL,
  synthetic_id integer NOT NULL, real_id integer NOT NULL,
  batch_id integer NOT NULL DEFAULT current_setting('manga_cast_dedupe.batch_id')::integer
);
CREATE TABLE IF NOT EXISTS moved_character_voice_actor (
  staff_id integer NOT NULL, language text NOT NULL,
  synthetic_id integer NOT NULL, real_id integer NOT NULL,
  batch_id integer NOT NULL DEFAULT current_setting('manga_cast_dedupe.batch_id')::integer
);
CREATE TABLE IF NOT EXISTS moved_character_nickname (
  id integer NOT NULL, synthetic_id integer NOT NULL, real_id integer NOT NULL,
  batch_id integer NOT NULL DEFAULT current_setting('manga_cast_dedupe.batch_id')::integer
);
CREATE TABLE IF NOT EXISTS moved_character_media (
  id integer NOT NULL, synthetic_id integer NOT NULL, real_id integer NOT NULL,
  batch_id integer NOT NULL DEFAULT current_setting('manga_cast_dedupe.batch_id')::integer
);

-- Skipped rows: R already held the same key, so S's copy was deleted (whole row).
CREATE TABLE IF NOT EXISTS skipped_anime_character (LIKE anime_character,
  batch_id integer NOT NULL DEFAULT current_setting('manga_cast_dedupe.batch_id')::integer);
CREATE TABLE IF NOT EXISTS skipped_manga_character (LIKE manga_character,
  batch_id integer NOT NULL DEFAULT current_setting('manga_cast_dedupe.batch_id')::integer);
CREATE TABLE IF NOT EXISTS skipped_character_voice_actor (LIKE character_voice_actor,
  batch_id integer NOT NULL DEFAULT current_setting('manga_cast_dedupe.batch_id')::integer);
CREATE TABLE IF NOT EXISTS skipped_character_nickname (LIKE character_nickname,
  batch_id integer NOT NULL DEFAULT current_setting('manga_cast_dedupe.batch_id')::integer);
CREATE TABLE IF NOT EXISTS skipped_character_media (LIKE character_media,
  batch_id integer NOT NULL DEFAULT current_setting('manga_cast_dedupe.batch_id')::integer);

-- Kind A: UPPERCASE manga_character rows removed because the same (manga, character) has
-- a Title-case (MAL) row. reason 'same-pair': both rows existed before the batch;
-- 'merged-pair': the UPPERCASE row arrived at R through this batch's kind-B merge.
CREATE TABLE IF NOT EXISTS removed_links (
  manga_id integer NOT NULL, character_id integer NOT NULL, role text NOT NULL,
  reason text NOT NULL CHECK (reason IN ('same-pair', 'merged-pair')),
  batch_id integer NOT NULL DEFAULT current_setting('manga_cast_dedupe.batch_id')::integer,
  PRIMARY KEY (batch_id, manga_id, character_id, role)
);
