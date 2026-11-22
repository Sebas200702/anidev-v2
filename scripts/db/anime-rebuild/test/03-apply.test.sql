-- T4 apply (runs after 02-audit.test.sql): writes the plan, logs previous values, never
-- deletes a relation, and the double-apply guard.
\ir ../sql/06-apply.sql

CREATE TEMP TABLE expected_anime AS TABLE before_anime;
UPDATE expected_anime SET type = 'TV', episodes = 24, year = 2005, season = 'fall',
  synopsis = E'First\n\nSecond & thirdあ…\n\nEnd', aired_from = '2005-10-02 00:00:00+00'
  WHERE mal_id = 2;
UPDATE expected_anime SET type = 'Movie', episodes = 1, year = 2010, season = 'summer'
  WHERE mal_id = 3;
UPDATE expected_anime SET type = 'OVA', episodes = 13, year = 2001, season = 'spring'
  WHERE mal_id = 4;
UPDATE expected_anime SET status = 'Currently Airing' WHERE mal_id = 7;
CREATE TEMP TABLE expected_relation AS TABLE before_anime_relation;
INSERT INTO expected_relation VALUES (1, 'Character', 10), (1, 'Sequel', 2), (2, 'Prequel', 1);

DO $$
BEGIN
  ASSERT same_rows('anime', 'expected_anime'), format('anime after apply: %s',
    (SELECT string_agg(format('(%s,%s,%s,%s,%s,%s)', mal_id, type, status, episodes, year,
      season), ' ' ORDER BY mal_id) FROM anime));
  ASSERT same_rows('anime_relation', 'expected_relation'), format('relations: %s',
    (SELECT string_agg(format('%s-%s-%s', anime_id, relation_type, related_anime_id), ' ')
     FROM anime_relation));
  ASSERT (SELECT count(*) FROM field_updates) = 15
    AND NOT EXISTS (SELECT anime_id, field, action, previous_value, new_value
                    FROM field_updates EXCEPT TABLE expected_fields),
    'every field change is logged with its previous value';
  ASSERT (SELECT array_agg(format('%s-%s-%s-%s', anime_id, relation_type, related_anime_id,
                           anilist_type) ORDER BY anime_id, relation_type)
          FROM inserted_relations)
    = ARRAY['1-Character-10-CHARACTER', '1-Sequel-2-SEQUEL', '2-Prequel-1-PREQUEL'],
    'inserted relations are logged';
  ASSERT (SELECT count(*) FROM applied) = 1, 'the apply is marked';
END $$;

CREATE TABLE applied_anime AS TABLE anime;
CREATE TABLE applied_anime_relation AS TABLE anime_relation;

-- A second apply is refused and writes nothing.
\echo '(expected: one anime-rebuild guard error below)'
\set ON_ERROR_STOP 0
\ir ../sql/06-apply.sql
\set ON_ERROR_STOP 1
SELECT set_config('anime_rebuild.guard', :'LAST_ERROR_MESSAGE', false) \g /dev/null
DO $$
BEGIN
  ASSERT current_setting('anime_rebuild.guard') LIKE 'anime-rebuild: already applied%',
    current_setting('anime_rebuild.guard');
  ASSERT all_same('applied_') AND (SELECT count(*) FROM field_updates) = 15
    AND (SELECT count(*) FROM inserted_relations) = 3
    AND (SELECT count(*) FROM applied) = 1, 'a refused apply writes nothing';
END $$;
