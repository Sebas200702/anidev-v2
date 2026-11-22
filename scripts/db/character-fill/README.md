# Character kanji + poster fill

Fills `character.name_kanji` placeholders with the AniList native name and gives
characters without a poster their AniList image. Plan and design:
`odd/tasks/catalog-rebuild.md` (T3, S5, Log L3/L4).

**Local database only.** `run.sh` refuses any host other than `localhost`, `127.0.0.1` or
`[::1]`; production is applied manually by the maintainer.

## Commands

```bash
bash scripts/db/character-fill/run.sh test      # fixtures in a throwaway schema
bash scripts/db/character-fill/run.sh audit     # dry run: prints counts, writes nothing
bash scripts/db/character-fill/run.sh apply     # ONE transaction, refused while applied
bash scripts/db/character-fill/run.sh rollback  # ONE transaction, exact undo
```

Logs live in the `character_fill` schema. The database URL comes from
`LOCAL_DATABASE_URL`, then `DATABASE_URL`, then `POSTGRES_*`.

## Sources

The staged AniList casts, reached through `character_external.anilist_id`:

| Table | Written by |
|---|---|
| `cast_relink.anilist_cast` | `scripts/db/cast-relink` (anime casts) |
| `manga_cast_relink.manga_cast` | `scripts/db/manga-cast-relink` (manga casts) |

A missing table or schema is not read. Stage (and apply) the manga relink first so its
casts count.

## Kanji

A placeholder is a `name_kanji` that is `NULL` or equal to `name` (romaji). For each
placeholder whose AniList id has a native name (trimmed, non-empty):

| Natives for the AniList id | Result |
|---|---|
| one, different from the placeholder | `name_kanji` = native; logged in `kanji_updates` with the previous value |
| one, equal to the placeholder | untouched |
| several different | untouched; logged in `kanji_conflicts` |

A non-placeholder `name_kanji` is never changed.

## Posters

A character with no `character_media` row of `media_type = 'poster'` gets one AniList
image: `media_type 'poster'`, `size NULL`, `source 'anilist'`, `priority 30` (after the
MAL posters, 20/25), as `scripts/db/cast-relink` does. AniList placeholders
(`/default.jpg`, `/default.png`) are skipped. With several images for one AniList id, the
anime cast wins, then the lowest anime / manga id. Inserted ids go to `inserted_posters`.

## rollback and guards

`rollback` restores every logged `name_kanji` to its previous value, deletes the inserted
posters and empties the logs. If a filled `name_kanji` was changed since the apply, the
rollback aborts and changes nothing. `apply` is refused while an apply is in place.

Roll this back before rolling back `scripts/db/manga-cast-relink`,
`scripts/db/cast-relink` or `scripts/db/character-external`: those can delete or merge the
characters this fill touched.
