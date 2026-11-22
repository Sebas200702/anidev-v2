-- T2: dry-run audit of the UPPERCASE-role cast links (runs after 01-staging.test.sql).
-- Staged fixtures: anime 100 (cast 501 Suneo Honekawa, 502 Hayata; size 2), 300 (size 0),
-- 400 (25 extras = truncated). Anime 200 is added here; anime 500 has no cast source.
INSERT INTO anilist_cast_source (anime_id, cast_size, source) VALUES (200, 4, 'test');
INSERT INTO anilist_cast (anime_id, anilist_character_id, role, name_full, name_keys) VALUES
  (200, 701, 'MAIN', 'Taro Yamada', ARRAY[norm_name('Taro Yamada')]),
  (200, 702, 'MAIN', 'Yamada Taro', ARRAY[norm_name('Yamada Taro')]),
  (200, 703, 'SUPPORTING', 'Kenji Mori', ARRAY[norm_name('Kenji Mori')]),
  (200, 704, 'SUPPORTING', 'Aiko Satou', ARRAY[norm_name('Aiko Satou')]);

CREATE TABLE "character" (mal_id integer PRIMARY KEY, name text NOT NULL,
                          name_kanji text, anilist_id integer);
INSERT INTO "character" (mal_id, name) VALUES
  (10, 'Honekawa, Suneo'), (11, 'Nobita'), (20, 'Suneo Honekawa'), (21, 'Hayata'),
  (22, 'Doraemon'), (30, 'Mori, Kenji'), (31, 'Kenji Mori'), (40, 'Yamada, Taro'),
  (41, 'Satō, Aiko'), (50, 'Nobody'), (60, 'Someone'), (61, 'Empty Cast'),
  (62, 'Hayata'), (1000000501, 'Suneo Honekawa'), (1000000502, 'Hayata'),
  (1000000703, 'Kenji Mori'), (1000000999, 'Ghost');

CREATE TABLE anime_character (anime_id integer NOT NULL, character_id integer NOT NULL,
                              role text NOT NULL, PRIMARY KEY (anime_id, character_id, role));
INSERT INTO anime_character (anime_id, character_id, role) VALUES
  -- Jikan cast (Title-case roles)
  (100, 10, 'Main'), (100, 11, 'Supporting'), (200, 30, 'Supporting'),
  (200, 31, 'Supporting'), (500, 62, 'Main'),
  -- UPPERCASE links (AniList import)
  (100, 11, 'SUPPORTING'), (100, 11, 'MAIN'),
  (100, 1000000501, 'MAIN'), (100, 1000000502, 'SUPPORTING'), (100, 1000000999, 'MAIN'),
  (100, 20, 'MAIN'), (100, 21, 'SUPPORTING'), (100, 22, 'BACKGROUND'),
  (200, 40, 'MAIN'), (200, 1000000703, 'SUPPORTING'), (200, 41, 'SUPPORTING'),
  (300, 61, 'MAIN'), (400, 50, 'MAIN'), (500, 60, 'MAIN');

CREATE TEMP TABLE links_before AS SELECT * FROM anime_character;

\ir ../sql/03-audit.sql

CREATE TEMP TABLE expected (
  anime_id integer, character_id integer, decision text, reason text,
  anilist_character_id integer, target_character_id integer, creates_character boolean
);
INSERT INTO expected VALUES
  (100, 11, 'dedupe', 'jikan-same-pair', NULL, NULL, false),
  (100, 1000000502, 'keep', 'synthetic-in-anilist-cast', 502, NULL, false),
  (100, 1000000501, 'repoint', 'synthetic-to-jikan', 501, 10, false),
  (100, 20, 'repoint', 'real-to-jikan', 501, 10, false),
  (100, 21, 'repoint', 'real-to-synthetic', 502, 1000000502, false),
  (200, 41, 'repoint', 'real-to-synthetic', 704, 1000000704, true),
  (100, 22, 'quarantine', 'no-anilist-match', NULL, NULL, false),
  (100, 1000000999, 'quarantine', 'no-anilist-match', NULL, NULL, false),
  (200, 40, 'quarantine', 'ambiguous', NULL, NULL, false),
  (200, 1000000703, 'quarantine', 'ambiguous', 703, NULL, false),
  (400, 50, 'pending-api', 'cast-truncated', NULL, NULL, false),
  (500, 60, 'pending-api', 'cast-missing', NULL, NULL, false),
  -- an empty CSV cast is missing data, not proof the link is wrong (L9)
  (300, 61, 'pending-api', 'cast-empty', NULL, NULL, false);

DO $$
DECLARE
  e expected%ROWTYPE;
  a audit%ROWTYPE;
BEGIN
  FOR e IN SELECT * FROM expected LOOP
    SELECT * INTO a FROM audit
    WHERE anime_id = e.anime_id AND character_id = e.character_id;
    ASSERT FOUND, format('audit row for (%s,%s)', e.anime_id, e.character_id);
    ASSERT a.decision = e.decision AND a.reason = e.reason,
      format('(%s,%s): expected %s/%s, got %s/%s', e.anime_id, e.character_id,
             e.decision, e.reason, a.decision, a.reason);
    ASSERT a.anilist_character_id IS NOT DISTINCT FROM e.anilist_character_id,
      format('(%s,%s): anilist id %s', e.anime_id, e.character_id, a.anilist_character_id);
    ASSERT a.target_character_id IS NOT DISTINCT FROM e.target_character_id,
      format('(%s,%s): target %s', e.anime_id, e.character_id, a.target_character_id);
    ASSERT a.creates_character = e.creates_character,
      format('(%s,%s): creates_character %s', e.anime_id, e.character_id, a.creates_character);
  END LOOP;
  ASSERT (SELECT count(*) FROM audit) = (SELECT count(*) FROM expected),
    'one audit row per distinct UPPERCASE pair; Title-case rows are not audited';
  ASSERT (SELECT roles FROM audit WHERE anime_id = 100 AND character_id = 11)
    = ARRAY['MAIN', 'SUPPORTING'], 'roles collects every UPPERCASE role of the pair';
  ASSERT NOT EXISTS (SELECT * FROM links_before EXCEPT SELECT * FROM anime_character)
    AND NOT EXISTS (SELECT * FROM anime_character EXCEPT SELECT * FROM links_before),
    'the audit is a dry run: anime_character is unchanged';
  ASSERT (SELECT count(*) FROM "character") = 17, 'the audit creates no character';
END $$;

-- Re-running rebuilds the audit from scratch.
\ir ../sql/03-audit.sql
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM audit) = 13, 're-running rebuilds the audit';
END $$;
