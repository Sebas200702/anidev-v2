-- Log tables of the fill, in the run schema (character_fill). 05-rollback.sql reads them to
-- restore the exact previous state and empties them.

-- One row while an apply is in place (the double-apply guard).
CREATE TABLE IF NOT EXISTS applied (applied_at timestamptz NOT NULL);

-- name_kanji values the apply replaced: previous_kanji is NULL or the romaji placeholder.
CREATE TABLE IF NOT EXISTS kanji_updates (
  character_id integer PRIMARY KEY, anilist_id integer NOT NULL,
  previous_kanji text, new_kanji text NOT NULL
);

-- Placeholder characters skipped because their AniList id has several different natives.
CREATE TABLE IF NOT EXISTS kanji_conflicts (
  character_id integer PRIMARY KEY, anilist_id integer NOT NULL, natives text[] NOT NULL
);

-- character_media rows the apply inserted (AniList posters).
CREATE TABLE IF NOT EXISTS inserted_posters (
  id integer PRIMARY KEY, character_id integer NOT NULL
);
