# character_external backfill and twin merge

Fills `character_external` (migration `0016_character-external`) and merges the synthetic
characters (`1000000000 + AniList id`) into their real MyAnimeList twin. Plan and design:
`odd/tasks/catalog-rebuild.md` (T1, S3, Log L3 and L7).

**Local database only.** `run.sh` refuses any host other than `localhost`, `127.0.0.1` or
`[::1]`; production is applied manually by the maintainer.

## Commands

```bash
bash scripts/db/character-external/run.sh test         # fixtures in a throwaway schema
bash scripts/db/character-external/run.sh backfill     # ONE transaction
bash scripts/db/character-external/run.sh merge-twins  # ONE transaction, needs backfill
bash scripts/db/character-external/run.sh rollback     # ONE transaction, exact undo
```

Each command prints its counts. Logs live in the `character_external_ops` schema.

## backfill

One `character_external` row per `"character"` row (`backfilled` logs the inserted ids and
`id_source` of the stored AniList id: `character`, `cast` or `synthetic`):

| Row | `mal_id` | `anilist_id` |
|---|---|---|
| real (`mal_id < 1e9`) | `character.mal_id` | `character.anilist_id`, else the cast-derived id |
| synthetic (`>= 1e9`) | `NULL` | `mal_id - 1e9` |

Cast-derived id (`sql/02-cast-ids.sql`, needs the `cast_relink` staging of
`scripts/db/cast-relink`, otherwise the backfill is refused): for each Jikan-cast link of a
real character R (`anime_character.role` not UPPERCASE), the only `cast_relink.anilist_cast`
entry X of the same anime whose `name_keys` hold `cast_relink.norm_name(R.name)` is a
candidate; R gets X when all its candidates agree. `character.anilist_id` wins.

Exceptions, logged in `conflicts` (`character_id`, `anilist_id`, `reason`):

| Reason | Meaning | `anilist_id` stored |
|---|---|---|
| `shared-anilist` | several real characters claim the AniList id (either source) | `NULL` for all of them |
| `cast-disagrees` | the cast derives another id (logged) than `character.anilist_id` | `character.anilist_id` |
| `twin-pending-merge` | synthetic twin of exactly one real character | `NULL` (the real row holds it) |
| `ambiguous-twin` | synthetic whose AniList id several real characters claim | kept; never merged |

## merge-twins

A twin is a synthetic `1e9 + X` whose `X` is held by a real character's
`character_external.anilist_id` (`merge_pairs`; the id is unique there). For each twin, rows of `anime_character`, `manga_character`,
`character_voice_actor`, `character_nickname` and `character_media` move from the
synthetic id to the real one (`moved_*`; nickname and media keep their `id`). A row whose
key (PK or unique index) the real character already holds is deleted instead
(`skipped_*`, whole row). Then the synthetic `"character"` row is deleted
(`deleted_characters`) with its `character_external` row (`deleted_externals`). The real
character row is not changed.

## rollback and guards

`rollback` undoes `merge-twins` (when applied) and then `backfill`, restoring the seven
tables exactly, and empties the logs. `backfill` is refused while a backfill is applied,
`merge-twins` while a merge is applied or before a backfill. If someone wrote a
conflicting key since the apply, a rollback statement fails and the transaction aborts.

Run this rollback before rolling back `scripts/db/cast-relink`: the merge can move links
that cast-relink inserted and delete synthetic characters it created.

The database URL comes from `LOCAL_DATABASE_URL`, then `DATABASE_URL`, then `POSTGRES_*`.
