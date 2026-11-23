-- Plan and dry-run audit: classifies kind A rows and kind B pairs; writes nothing.
\ir fixtures.sql

BEGIN;
\ir ../sql/02-plan.sql
DO $$
BEGIN
  ASSERT (SELECT array_agg(format('%s>%s:%s', synthetic_id, real_id, status)
            ORDER BY synthetic_id, real_id) FROM b_pair) = ARRAY[
      '1000000503>4:anilist-disagrees', '1000000507>2:merge', '1000000950>1:merge',
      '1000000953>3:ambiguous', '1000000960>5:ambiguous',
      '1000000970>7:shared-anilist', '1000000970>8:shared-anilist'],
    format('b_pair: %s', (SELECT string_agg(format('%s>%s:%s', synthetic_id, real_id,
      status), ' ') FROM b_pair));
  ASSERT (SELECT anilist_id FROM b_pair WHERE real_id = 2) = 507,
    'long-vowel name "Doujima, Kengo" matches "Kengo Dojima"';
  ASSERT (SELECT array_agg(format('%s/%s/%s>%s:%s', manga_id, character_id, role,
            target_id, via_merge) ORDER BY manga_id, character_id) FROM a_row) = ARRAY[
      '10/6/SUPPORTING>6:f', '10/1000000950/MAIN>1:t', '11/1/MAIN>1:f',
      '20/1000000507/SUPPORTING>2:t'],
    format('a_row: %s', (SELECT string_agg(format('%s/%s/%s>%s:%s', manga_id,
      character_id, role, target_id, via_merge), ' ') FROM a_row));
END $$;
ROLLBACK;

\o /dev/null
\ir ../sql/03-audit.sql
\o
DO $$
BEGIN
  ASSERT all_same('before_'), 'audit writes nothing';
  ASSERT NOT EXISTS (SELECT 1 FROM batches), 'audit logs no batch';
END $$;

-- Without the manga cast staging, audit is refused.
\set saved_relink_schema :relink_schema
\set relink_schema no_such_relink_schema
\echo '(expected: one manga-cast-dedupe staging error below)'
\set ON_ERROR_STOP 0
\ir ../sql/03-audit.sql
\set ON_ERROR_STOP 1
\set relink_schema :saved_relink_schema
SELECT set_config('manga_cast_dedupe.guard', :'LAST_ERROR_MESSAGE', false) \g /dev/null
DO $$
BEGIN
  ASSERT current_setting('manga_cast_dedupe.guard')
    LIKE 'manga-cast-dedupe: manga cast staging is absent%',
    current_setting('manga_cast_dedupe.guard');
END $$;
