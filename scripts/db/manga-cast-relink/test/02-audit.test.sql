-- audit (dry run): one decision per distinct (manga_id, character_id) plus audit_add for
-- AniList cast entries of a found manga with no local link. Writes no public table.
\ir ../sql/03-audit.sql

CREATE TEMP TABLE audit_expected (
  manga_id integer, character_id integer, roles text[], decision text, reason text,
  anilist_character_id integer, target_character_id integer, creates_character boolean
);
INSERT INTO audit_expected VALUES
  (10, 1, '{MAIN,Main}', 'keep', 'in-anilist-cast', 501, NULL, false),
  (10, 2, '{MAIN}', 'repoint', 'name-match', 501, 1, false),
  (10, 3, '{BACKGROUND,MAIN}', 'repoint', 'name-match', 503, 1000000503, true),
  (10, 12, '{MAIN}', 'repoint', 'name-match', 503, 1000000503, true),
  (10, 4, '{SUPPORTING}', 'repoint', 'name-match', 502, 20, false),
  (10, 11, '{MAIN}', 'repoint', 'name-match', 507, 1000000507, false),
  (10, 5, '{BACKGROUND}', 'quarantine', 'ambiguous', NULL, NULL, false),
  (10, 6, '{BACKGROUND}', 'quarantine', 'no-anilist-match', NULL, NULL, false),
  (30, 7, '{MAIN}', 'pending', 'not-found', NULL, NULL, false),
  (40, 8, '{MAIN}', 'pending', 'fetch-error', NULL, NULL, false),
  (50, 9, '{MAIN}', 'pending', 'not-fetched', NULL, NULL, false),
  (60, 9, '{SUPPORTING}', 'pending', 'cast-empty', NULL, NULL, false);

CREATE TEMP TABLE add_expected (
  manga_id integer, anilist_character_id integer, role text,
  target_character_id integer, creates_character boolean
);
INSERT INTO add_expected VALUES
  (10, 504, 'BACKGROUND', 1000000504, true),
  (10, 505, 'BACKGROUND', 1000000505, true),
  (10, 506, 'SUPPORTING', 21, false);

DO $$
BEGIN
  ASSERT same_rows('audit', 'audit_expected'),
    format('audit: %s', (SELECT string_agg(a::text, ' ' ORDER BY a.manga_id,
      a.character_id) FROM audit a));
  ASSERT same_rows('audit_add', 'add_expected'),
    format('audit_add: %s', (SELECT string_agg(a::text, ' ') FROM audit_add a));
  ASSERT all_same('before_'), 'the audit writes no public table';
END $$;
