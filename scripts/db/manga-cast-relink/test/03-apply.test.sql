-- apply (runs after 02-audit.test.sql, same schema): ONE transaction acting on the audit
-- and audit_add; every change logged. Pending pairs are untouched.
\ir ../sql/04-apply.sql

CREATE TEMP TABLE links_expected (manga_id integer, character_id integer, role text);
INSERT INTO links_expected VALUES
  (10, 1, 'MAIN'),                                           -- keep (case dup removed)
  (30, 7, 'MAIN'), (40, 8, 'MAIN'), (50, 9, 'MAIN'), (60, 9, 'SUPPORTING'), -- pending
  (10, 1000000503, 'SUPPORTING'), (10, 20, 'SUPPORTING'),    -- repoint, AniList role
  (10, 1000000507, 'MAIN'),
  (10, 1000000504, 'BACKGROUND'), (10, 1000000505, 'BACKGROUND'), -- add
  (10, 21, 'SUPPORTING');

CREATE TEMP TABLE removed_expected (
  manga_id integer, character_id integer, role text, decision text, reason text);
INSERT INTO removed_expected VALUES
  (10, 1, 'Main', 'keep', 'case-duplicate'),
  (10, 2, 'MAIN', 'repoint', 'name-match'),
  (10, 3, 'MAIN', 'repoint', 'name-match'), (10, 3, 'BACKGROUND', 'repoint', 'name-match'),
  (10, 12, 'MAIN', 'repoint', 'name-match'), (10, 4, 'SUPPORTING', 'repoint', 'name-match'),
  (10, 11, 'MAIN', 'repoint', 'name-match'),
  (10, 5, 'BACKGROUND', 'quarantine', 'ambiguous'),
  (10, 6, 'BACKGROUND', 'quarantine', 'no-anilist-match');

CREATE TEMP TABLE inserted_expected (
  manga_id integer, character_id integer, role text, source text);
INSERT INTO inserted_expected VALUES
  (10, 1000000503, 'SUPPORTING', 'repoint'), (10, 20, 'SUPPORTING', 'repoint'),
  (10, 1000000507, 'MAIN', 'repoint'), (10, 1000000504, 'BACKGROUND', 'add'),
  (10, 1000000505, 'BACKGROUND', 'add'), (10, 21, 'SUPPORTING', 'add');

DO $$
BEGIN
  ASSERT same_rows('manga_character', 'links_expected'),
    format('manga_character after apply: %s', (SELECT string_agg(
      format('(%s,%s,%s)', manga_id, character_id, role), ' ') FROM manga_character));
  ASSERT same_rows('removed_links', 'removed_expected'),
    format('removed_links: %s', (SELECT string_agg(r::text, ' ') FROM removed_links r));
  ASSERT same_rows('inserted_links', 'inserted_expected'),
    format('inserted_links: %s', (SELECT string_agg(i::text, ' ') FROM inserted_links i));
  ASSERT (SELECT array_agg((mal_id, name, name_kanji, anilist_id)::text ORDER BY mal_id)
          FROM "character" WHERE mal_id NOT IN (SELECT mal_id FROM before_character))
    = ARRAY[(1000000503, 'Kenji Mori', '森', NULL)::text,
            (1000000504, 'Narrator', NULL, NULL)::text,
            (1000000505, 'Narrator', '語り手', NULL)::text],
    'missing targets are created from the AniList cast (name_kanji = native)';
  ASSERT (SELECT array_agg((mal_id, anilist_id)::text ORDER BY mal_id) FROM created_characters)
    = ARRAY[(1000000503, 503)::text, (1000000504, 504)::text, (1000000505, 505)::text],
    'created characters are logged';
  ASSERT (SELECT array_agg((character_id, mal_id, anilist_id, anidb_id)::text
                           ORDER BY character_id)
          FROM character_external WHERE character_id >= 1000000503
            AND character_id <> 1000000507)
    = ARRAY[(1000000503, NULL, 503, NULL)::text, (1000000504, NULL, 504, NULL)::text,
            (1000000505, NULL, 505, NULL)::text],
    'each created character gets its character_external AniList id';
  ASSERT (SELECT array_agg((character_id, media_type, src, size, source, priority)::text
                           ORDER BY character_id)
          FROM character_media WHERE id IN (SELECT id FROM created_media))
    = ARRAY[(1000000503, 'poster',
             'https://s4.anilist.co/file/anilistcdn/character/large/b503.png', NULL,
             'anilist', 30)::text,
            (1000000505, 'poster',
             'https://s4.anilist.co/file/anilistcdn/character/large/b505.png', NULL,
             'anilist', 30)::text],
    'AniList posters for created characters, default.jpg skipped';
  ASSERT (SELECT count(*) FROM character_media) = 3, 'no other media is written';
  ASSERT NOT EXISTS (SELECT * FROM before_character EXCEPT SELECT * FROM "character")
    AND NOT EXISTS (SELECT * FROM before_character_external
                    EXCEPT SELECT * FROM character_external),
    'existing characters and external ids are unchanged';
END $$;
