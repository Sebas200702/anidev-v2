-- T4 rollback (runs after 03-apply.test.sql): exact restore, empty logs, re-apply gives the
-- same state, and a value changed since the apply aborts the rollback.
\ir ../sql/07-rollback.sql

DO $$
BEGIN
  ASSERT all_same('before_'), 'rollback restores anime and anime_relation exactly';
  ASSERT (SELECT count(*) FROM applied) + (SELECT count(*) FROM field_updates)
    + (SELECT count(*) FROM inserted_relations) = 0, 'rollback empties the logs';
END $$;

-- The guard is released: apply again gives the same state.
\ir ../sql/06-apply.sql
DO $$
BEGIN
  ASSERT all_same('applied_'), 're-applying after a rollback gives the same state';
END $$;

-- Each kind of drift aborts the rollback and changes nothing: an integer, a text and a
-- timestamp field.
CREATE TEMP TABLE drift (stmt text, undo text);
INSERT INTO drift VALUES
  ('UPDATE anime SET episodes = 99 WHERE mal_id = 4',
   'UPDATE anime SET episodes = 13 WHERE mal_id = 4'),
  ('UPDATE anime SET synopsis = ''edited'' WHERE mal_id = 2',
   E'UPDATE anime SET synopsis = E''First\\n\\nSecond & thirdあ…\\n\\nEnd'' WHERE mal_id = 2'),
  ('UPDATE anime SET aired_from = ''2005-10-03+00'' WHERE mal_id = 2',
   'UPDATE anime SET aired_from = ''2005-10-02+00'' WHERE mal_id = 2');
SELECT stmt, undo FROM drift ORDER BY stmt LIMIT 1 OFFSET 0 \gset d0_
SELECT stmt, undo FROM drift ORDER BY stmt LIMIT 1 OFFSET 1 \gset d1_
SELECT stmt, undo FROM drift ORDER BY stmt LIMIT 1 OFFSET 2 \gset d2_

\ir drift-case.sql
\set d0_stmt :d1_stmt
\set d0_undo :d1_undo
\ir drift-case.sql
\set d0_stmt :d2_stmt
\set d0_undo :d2_undo
\ir drift-case.sql

-- With the values restored the rollback finishes exactly.
\ir ../sql/07-rollback.sql
DO $$
BEGIN
  ASSERT all_same('before_'), 'rollback after re-apply is exact';
END $$;
