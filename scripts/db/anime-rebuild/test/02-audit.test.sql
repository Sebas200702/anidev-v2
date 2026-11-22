-- T4 audit (runs after 01-functions.test.sql, same schema): relation edges, fills,
-- source-majority corrections, exclusions, unmapped vocabulary, and a dry run.
\o /dev/null
\ir ../sql/05-audit.sql
\o

CREATE TEMP TABLE expected_fields (anime_id integer, field text, action text,
                                   previous_value text, new_value text);
INSERT INTO expected_fields VALUES
  (2, 'aired_from', 'fill', NULL, '2005-10-02 00:00:00+00'),
  (2, 'episodes', 'fill', NULL, '24'), (2, 'season', 'fill', NULL, 'fall'),
  (2, 'synopsis', 'fill', NULL, E'First\n\nSecond & thirdあ…\n\nEnd'),
  (2, 'type', 'fill', NULL, 'TV'), (2, 'year', 'fill', NULL, '2005'),
  (3, 'episodes', 'fill', NULL, '1'), (3, 'season', 'fill', NULL, 'summer'),
  (3, 'type', 'fill', NULL, 'Movie'), (3, 'year', 'fill', NULL, '2010'),
  (4, 'episodes', 'majority', '12', '13'), (4, 'season', 'majority', 'winter', 'spring'),
  (4, 'type', 'majority', 'TV', 'OVA'), (4, 'year', 'majority', '2000', '2001'),
  (7, 'status', 'majority', 'Finished Airing', 'Currently Airing');

DO $$
BEGIN
  ASSERT same_rows('field_plan', 'expected_fields'),
    format('field_plan: %s', (SELECT string_agg(format('(%s,%s,%s,%s,%s)', anime_id, field,
      action, previous_value, new_value), ' ' ORDER BY anime_id, field) FROM field_plan));
  -- Sources that disagree (5), an ambiguous AniList (8), blank results and partial dates
  -- (9), an 'N/A' description (13) and stored values the sources confirm (1, 10) plan
  -- nothing.
  ASSERT NOT EXISTS (SELECT 1 FROM field_plan WHERE anime_id IN (1, 5, 6, 8, 9, 10, 12, 13)),
    'no change without a value to fill or a source majority';

  ASSERT (SELECT array_agg(format('%s:%s:%s', field, reason, anime_id)
                           ORDER BY field, reason, anime_id) FROM majority_excluded)
    = ARRAY['episodes:source airing:7', 'episodes:source airing:12',
            'episodes:stored airing:6',
            'status:stored airing:6', 'type:offline-db has no Music type:13'],
    format('majority_excluded: %s', (SELECT string_agg(format('%s:%s:%s', field, reason,
      anime_id), ' ') FROM majority_excluded));

  ASSERT (SELECT array_agg(format('%s-%s-%s', anime_id, relation_type, related_anime_id)
                           ORDER BY anime_id, relation_type) FROM relation_plan)
    = ARRAY['1-Character-10', '1-Sequel-2', '2-Prequel-1'],
    format('relation_plan: %s', (SELECT string_agg(format('%s-%s-%s', anime_id,
      relation_type, related_anime_id), ' ') FROM relation_plan));
  ASSERT (SELECT array_agg(format('%s-%s', anime_id, related_anime_id)) FROM offline_untyped)
    = ARRAY['1-5'], 'offline-db relatedAnime only reported (untyped, never inserted)';
  ASSERT (SELECT array_agg(format('%s/%s/%s=%s', kind, source, value, rows)
                           ORDER BY kind, source, value) FROM unmapped_vocab)
    = ARRAY['relation/anilist/SOURCE=1', 'season/offline/UNDEFINED=1',
            'status/anilist/CANCELLED=2', 'status/offline/UNKNOWN=1',
            'type/offline/UNKNOWN=1'],
    format('unmapped_vocab: %s', (SELECT string_agg(format('%s/%s/%s=%s', kind, source,
      value, rows), ' ') FROM unmapped_vocab));

  ASSERT all_same('before_'), 'audit writes no public table';
  ASSERT (SELECT count(*) FROM applied) + (SELECT count(*) FROM field_updates)
    + (SELECT count(*) FROM inserted_relations) = 0, 'audit writes no log';
END $$;
