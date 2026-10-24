/**
 * SQL fragments of the producer list query.
 *
 * @module domains/producer/repositories/producer-list/helpers
 * @remarks
 * Every value is a bound parameter (`sql` template); no input is interpolated.
 */
import { DEFAULT_PRODUCER_TITLE_TYPE } from '@producer/constants'
import type { ProducerListQuery, ProducerRole } from '@producer/types'
import { sql, type SQL } from 'drizzle-orm'

/** Credits of every producer across anime and manga, optionally one role. */
const creditsSql = (role?: ProducerRole) => {
  const byRole = role ? sql`WHERE role = ${role}` : sql``
  return sql`SELECT producer_id FROM anime_producer ${byRole}
    UNION ALL SELECT producer_id FROM manga_producer ${byRole}`
}

/** Display name per producer: the `Default` title, else the first by name. */
const namesSql = sql`SELECT DISTINCT ON (producer_id) producer_id, title
  FROM producer_title
  ORDER BY producer_id, (type <> ${DEFAULT_PRODUCER_TITLE_TYPE}), title`

/**
 * `FROM … WHERE …` shared by the page and the count queries.
 *
 * @param filters - `role` keeps producers with ≥ 1 credit in it; `query`
 *   matches any title (`ILIKE`)
 */
export const producerListFromSql = ({
  role,
  query,
}: Pick<ProducerListQuery, 'role' | 'query'>): SQL => {
  const byRole = role ? sql`AND COALESCE(w.works, 0) > 0` : sql``
  const byQuery = query
    ? sql`AND EXISTS (SELECT 1 FROM producer_title t
        WHERE t.producer_id = p.mal_id AND t.title ILIKE ${`%${query}%`})`
    : sql``
  return sql`FROM producer p
    LEFT JOIN (${namesSql}) n ON n.producer_id = p.mal_id
    LEFT JOIN (SELECT producer_id, count(*)::int AS works
      FROM (${creditsSql(role)}) c GROUP BY producer_id) w
      ON w.producer_id = p.mal_id
    WHERE TRUE ${byRole} ${byQuery}`
}

/** ORDER BY of the whitelisted sort, with `mal_id` as stable tiebreaker. */
export const producerListOrderSql = (sort: ProducerListQuery['sort']): SQL =>
  sort === 'name'
    ? sql`ORDER BY n.title ASC NULLS LAST, p.mal_id ASC`
    : sql`ORDER BY works DESC, p.mal_id ASC`
