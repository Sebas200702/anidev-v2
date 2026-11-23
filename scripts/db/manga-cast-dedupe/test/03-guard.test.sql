-- Double-apply guard and re-runs after more MAL rows arrive (runs after 02-apply).
\echo '(expected: one manga-cast-dedupe guard error below)'
\set ON_ERROR_STOP 0
\ir ../sql/04-apply.sql
\set ON_ERROR_STOP 1
SELECT set_config('manga_cast_dedupe.guard', :'LAST_ERROR_MESSAGE', false) \g /dev/null
DO $$
BEGIN
  ASSERT current_setting('manga_cast_dedupe.guard')
    LIKE 'manga-cast-dedupe: nothing to apply%', current_setting('manga_cast_dedupe.guard');
  ASSERT all_same('applied_') AND (SELECT count(*) FROM batches) = 1,
    'a second apply writes nothing and logs no batch';
END $$;

-- More MAL rows arrive: a new kind A pair (manga 40) and a new kind B pair (manga 41).
INSERT INTO "character" (mal_id, name) VALUES (9, 'Sawamura, Daichi'),
  (1000000980, 'Daichi Sawamura');
INSERT INTO character_external (character_id, mal_id, anilist_id, created_at, updated_at)
VALUES (9, 9, NULL, '2026-02-01', '2026-02-01'),
  (1000000980, NULL, 980, '2026-02-01', '2026-02-01');
INSERT INTO manga_character (manga_id, character_id, role) VALUES
  (40, 6, 'MAIN'), (40, 6, 'Main'), (41, 9, 'Main'), (41, 1000000980, 'MAIN');
INSERT INTO :"relink_schema".manga_cast (manga_id, anilist_character_id, name_full,
  name_keys)
VALUES (41, 980, 'Daichi Sawamura', ARRAY[:"relink_schema".norm_name('Daichi Sawamura')]);
SELECT snapshot('loaded_') \g /dev/null

-- The second audit reports only the new pairs as actionable (left-alone ones stay).
BEGIN;
\ir ../sql/02-plan.sql
DO $$
BEGIN
  ASSERT (SELECT array_agg(format('%s>%s', synthetic_id, real_id)) FROM b_pair
          WHERE status = 'merge') = ARRAY['1000000980>9'], 'only the new merge';
  ASSERT (SELECT array_agg(format('%s/%s/%s', manga_id, character_id, role)
            ORDER BY manga_id) FROM a_row) = ARRAY['40/6/MAIN', '41/1000000980/MAIN'],
    'only the new kind A rows';
  ASSERT (SELECT count(*) FROM b_pair WHERE status <> 'merge') = 5,
    'ambiguous and conflicting pairs are still left alone and counted';
END $$;
ROLLBACK;

\ir ../sql/04-apply.sql
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM batches) = 2, 'a new batch';
  ASSERT (SELECT array_agg(format('%s/%s/%s:%s', manga_id, character_id, role, reason)
            ORDER BY manga_id) FROM removed_links WHERE batch_id = 2)
    = ARRAY['40/6/MAIN:same-pair', '41/9/MAIN:merged-pair'], 'batch 2 kind A';
  ASSERT (SELECT anilist_id FROM character_external WHERE character_id = 9) = 980
    AND NOT EXISTS (SELECT 1 FROM "character" WHERE mal_id = 1000000980),
    'batch 2 kind B';
  ASSERT (SELECT count(*) FROM removed_links WHERE batch_id = 1) = 4,
    'batch 1 logs are kept';
END $$;
