-- T3: merge the AniList API casts (run.sh loaded test/fixtures/anilist-api.jsonl into
-- anilist_api_raw) into staging, then re-run the audit (runs after 02-audit.test.sql).
-- Fixture: 400 found (28 edges, 27 distinct: CSV extras 600..624, 625 "Nobody", 626 with
-- a backslash and a tab; 600 repeated); 500 not found; 300 errored; 600 errored then found.
INSERT INTO "character" (mal_id, name) VALUES (51, 'Unlisted');
INSERT INTO anime_character (anime_id, character_id, role) VALUES (400, 51, 'MAIN');

CREATE TEMP TABLE source_before AS SELECT * FROM anilist_cast_source;
CREATE TEMP TABLE cast_before AS SELECT * FROM anilist_cast;

\ir ../sql/04-merge-api.sql

DO $$
DECLARE
  nobody anilist_cast%ROWTYPE;
BEGIN
  ASSERT (SELECT count(*) FROM anilist_cast WHERE anime_id = 400) = 27,
    'the truncated cast is replaced by the full API cast; duplicate edges load once';
  SELECT * INTO nobody FROM anilist_cast WHERE anime_id = 400 AND anilist_character_id = 625;
  ASSERT nobody.role = 'MAIN' AND nobody.name_native = '誰でもない'
    AND nobody.image_url = 'https://s4.anilist.co/file/anilistcdn/character/large/b625.png',
    'role, native name and image come from the API';
  ASSERT nobody.name_keys @> ARRAY[norm_name('Nobody'), norm_name('No "Body"')],
    'name keys hold the full name and the alternatives';
  ASSERT (SELECT name_full FROM anilist_cast WHERE anime_id = 400 AND anilist_character_id = 626)
    = E'Back\\slash, Tab\tName', 'backslashes and escaped tabs survive the raw load';
  ASSERT (SELECT (cast_size, source) FROM anilist_cast_source WHERE anime_id = 400)
    = (27, 'anilist-api'::text), 'source and real cast size are updated';
  ASSERT (SELECT (cast_size, source) FROM anilist_cast_source WHERE anime_id = 600)
    = (1, 'anilist-api'::text), 'an anime missing from the CSV gets its API cast';
  ASSERT (SELECT name_keys FROM anilist_cast WHERE anime_id = 600) = ARRAY[norm_name('Api Only')],
    'a null alternative list adds no key';
  ASSERT NOT EXISTS (SELECT 1 FROM anilist_cast_source WHERE anime_id = 500)
    AND NOT EXISTS (SELECT 1 FROM anilist_cast WHERE anime_id = 500),
    'a not-found anime leaves staging untouched';
  ASSERT (SELECT (cast_size, source) FROM anilist_cast_source WHERE anime_id = 300)
    = (0, 'kaggle-csv'::text), 'an errored anime leaves staging untouched';
  ASSERT NOT EXISTS (
    SELECT * FROM cast_before WHERE anime_id NOT IN (400, 600)
    EXCEPT SELECT * FROM anilist_cast
  ) AND NOT EXISTS (
    SELECT * FROM source_before WHERE anime_id NOT IN (400, 600)
    EXCEPT SELECT * FROM anilist_cast_source
  ), 'animes absent from the API output keep their rows';
END $$;

-- Re-running the merge is idempotent.
CREATE TEMP TABLE cast_merged AS SELECT * FROM anilist_cast;
CREATE TEMP TABLE source_merged AS SELECT * FROM anilist_cast_source;
\ir ../sql/04-merge-api.sql
DO $$
BEGIN
  ASSERT NOT EXISTS (SELECT * FROM cast_merged EXCEPT SELECT * FROM anilist_cast)
    AND NOT EXISTS (SELECT * FROM anilist_cast EXCEPT SELECT * FROM cast_merged),
    're-running the merge leaves anilist_cast unchanged';
  ASSERT NOT EXISTS (SELECT * FROM source_merged EXCEPT SELECT * FROM anilist_cast_source)
    AND NOT EXISTS (SELECT * FROM anilist_cast_source EXCEPT SELECT * FROM source_merged),
    're-running the merge leaves anilist_cast_source unchanged';
END $$;

-- The audit re-classifies: an API cast is complete even with 25 or more characters.
\ir ../sql/03-audit.sql
DO $$
BEGIN
  ASSERT (SELECT (decision, reason, anilist_character_id, target_character_id, creates_character)
          FROM audit WHERE anime_id = 400 AND character_id = 50)
    = ('repoint'::text, 'real-to-synthetic'::text, 625, 1000000625, true),
    'the link found in the full API cast is re-pointed';
  ASSERT (SELECT (decision, reason) FROM audit WHERE anime_id = 400 AND character_id = 51)
    = ('quarantine'::text, 'no-anilist-match'::text), 'a character absent from the full API cast';
  ASSERT (SELECT (decision, reason) FROM audit WHERE anime_id = 500 AND character_id = 60)
    = ('pending-api'::text, 'cast-missing'::text), 'a not-found anime stays pending';
  ASSERT (SELECT (decision, reason) FROM audit WHERE anime_id = 300 AND character_id = 61)
    = ('pending-api'::text, 'cast-empty'::text), 'an errored anime stays pending';
END $$;
