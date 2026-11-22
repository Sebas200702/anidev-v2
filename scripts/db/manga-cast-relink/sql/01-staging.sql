-- Manga cast relink staging and log objects. Runs with search_path = <schema>, public:
-- everything is created in manga_cast_relink (manga_cast_relink_test for the tests).
-- norm_name is created by run.sh from scripts/db/cast-relink/sql/01-staging.sql.

-- Raw AniList API lines from fetch-anilist.ts --type MANGA, in file order (`anime_id`
-- holds the MAL manga id).
CREATE TABLE IF NOT EXISTS api_raw (seq bigserial PRIMARY KEY, line text);

-- AniList cast per MAL manga id, one row per AniList character.
CREATE TABLE IF NOT EXISTS manga_cast (
  manga_id integer NOT NULL,
  anilist_character_id integer NOT NULL,
  role text,
  name_full text,
  name_native text,
  image_url text,
  name_keys text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (manga_id, anilist_character_id)
);

-- Fetch outcome per manga: found (cast_size = AniList cast size), not-found or error.
CREATE TABLE IF NOT EXISTS manga_cast_source (
  manga_id integer PRIMARY KEY,
  status text NOT NULL CHECK (status IN ('found', 'not-found', 'error')),
  cast_size integer NOT NULL,
  error text
);

-- Apply logs (04-apply.sql); 05-rollback.sql restores from them and empties them.
CREATE TABLE IF NOT EXISTS removed_links (
  manga_id integer NOT NULL, character_id integer NOT NULL, role text NOT NULL,
  decision text NOT NULL, reason text NOT NULL,
  PRIMARY KEY (manga_id, character_id, role)
);
CREATE TABLE IF NOT EXISTS inserted_links (
  manga_id integer NOT NULL, character_id integer NOT NULL, role text NOT NULL,
  source text NOT NULL CHECK (source IN ('repoint', 'add')),
  PRIMARY KEY (manga_id, character_id, role)
);
CREATE TABLE IF NOT EXISTS created_characters (
  mal_id integer PRIMARY KEY, anilist_id integer NOT NULL
);
CREATE TABLE IF NOT EXISTS created_media (
  id integer PRIMARY KEY, character_id integer NOT NULL
);
