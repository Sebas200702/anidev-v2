-- Cast relink staging objects. Runs with search_path = <schema>, public: every object
-- below is created in the cast_relink schema (or cast_relink_test for the tests).

-- Order-insensitive name key, so MAL "Honekawa, Suneo" matches AniList "Suneo Honekawa".
-- Long vowels collapse to one letter, so MAL "Doujima"/"Satō" match AniList "Dojima"/"Sato".
CREATE OR REPLACE FUNCTION norm_name(name text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT nullif(array_to_string(ARRAY(
    SELECT token
    FROM regexp_split_to_table(
      regexp_replace(
        regexp_replace(regexp_replace(
          translate(lower(name), 'ōūāēī', 'ouaei'),
          '(ou|oo)', 'o', 'g'), '([uaei])\1', '\1', 'g'),
        '[^[:alnum:]]+', ' ', 'g'),
      ' ') AS token
    WHERE token <> ''
    ORDER BY token
  ), ' '), '')
$$;

-- Raw AniList Kaggle CSV (calebmwelsh/anilist-anime-dataset): 62 columns, loaded as text.
-- Used columns: c02 = AniList media id, c03 = idMal ("123.0"), c54 = characters JSON.
CREATE TABLE IF NOT EXISTS anilist_raw (
  c01 text, c02 text, c03 text, c04 text, c05 text, c06 text, c07 text, c08 text,
  c09 text, c10 text, c11 text, c12 text, c13 text, c14 text, c15 text, c16 text,
  c17 text, c18 text, c19 text, c20 text, c21 text, c22 text, c23 text, c24 text,
  c25 text, c26 text, c27 text, c28 text, c29 text, c30 text, c31 text, c32 text,
  c33 text, c34 text, c35 text, c36 text, c37 text, c38 text, c39 text, c40 text,
  c41 text, c42 text, c43 text, c44 text, c45 text, c46 text, c47 text, c48 text,
  c49 text, c50 text, c51 text, c52 text, c53 text, c54 text, c55 text, c56 text,
  c57 text, c58 text, c59 text, c60 text, c61 text, c62 text
);

-- Raw anime-offline-database JSONL, one line per row (the first line is a header).
CREATE TABLE IF NOT EXISTS offline_db_raw (line text);

-- AniList cast per MAL anime id, one row per AniList character.
CREATE TABLE IF NOT EXISTS anilist_cast (
  anime_id integer NOT NULL,
  anilist_character_id integer NOT NULL,
  role text NOT NULL,
  name_full text,
  name_native text,
  image_url text,
  name_keys text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (anime_id, anilist_character_id)
);

-- Which source supplied each anime's cast and how many characters it held
-- (25 = first AniList page only, so absence is not proof).
CREATE TABLE IF NOT EXISTS anilist_cast_source (
  anime_id integer PRIMARY KEY,
  cast_size integer NOT NULL,
  source text NOT NULL
);

-- MAL anime id → AniList anime id, from the offline database.
CREATE TABLE IF NOT EXISTS anime_anilist_map (
  mal_id integer PRIMARY KEY,
  anilist_id integer NOT NULL
);

-- Raw AniList API casts from fetch-anilist.ts (JSONL), in file order: an anime may appear
-- twice when an errored fetch was retried on resume, so the latest found line wins.
CREATE TABLE IF NOT EXISTS anilist_api_raw (seq bigserial PRIMARY KEY, line text);
