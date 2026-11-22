# Catalog rebuild — phase 2 of the DB recomposition

Rebuild and improve the local catalog with the downloaded datasets and other sources,
after phase 1 (`odd/tasks/cast-relink.md`). Local DB only; production is applied by the
maintainer. Same method as phase 1: dry-run audit, sampled validation, reversible apply.

## Specs

- **S1** — "continuemos con la reconstrucion y mejora de la base de datos usando los
  datasets y otras fuentes". Scope chosen by the user (L2): manga cast, character kanji
  and posters, anime relations, and a staff / voice-actor audit — "todo".
- **S2** — Conflicts: "Aplicar la mayoría de fuentes" — when AniList and the
  anime-offline-database agree against the stored (MAL) value, the value is corrected and
  logged so it can be reverted. Empty fields are filled from the sources.
- **S3** — Synthetic ids: replace the `1000000000 + AniList id` trick with a
  `character_external` table "Ahora", before touching the manga cast.
- **S4** — Manga cast: the 194,613 `manga_character` links come from the AniList import
  that resolved characters by global name ("Narrator" in 140 mangas; Pedro and Kawashima
  in Haikyuu!!). Re-resolve them against AniList manga casts without losing correct links.
- **S5** — Characters: `name_kanji` holding romaji (27,637) gets AniList `name.native`;
  AniList characters without a poster get their AniList image (46,651 fillable).
- **S6** — Anime relations: add the missing ones (10,028 where both anime exist), typed
  from AniList when available.
- **S7** — Staff and voice actors: read-only audit first; fixes only after the numbers.

## Tasks

- **T1** (S3) — `character_external` schema + Drizzle migration 0016 + local backfill + twin merge (logged, reversible) + app docs. Route: gentle-ai-worker. Risk: items 1, 3. Commit: see git log ✅ (code + local apply; independent verify in T6)
- **T2** (S4) — Manga cast relink: fetch AniList manga casts (batched), audit, apply, rollback. Route: worker. Risk: item 1. Commit: see git log (code ✅; fetch/apply pending)
- **T3** (S5) — Kanji + posters fill, logged and reversible. Route: worker. Risk: item 1. Commit: see git log (code ✅; dry run before manga staging: kanji 25,258, posters 37,250; apply after T2)
- **T4** (S2,S6) — Anime relations + field conflicts by source majority, logged and reversible. Route: worker. Risk: item 1. Commit: see git log ✅ (applied: 509 field updates, 200 relations; relations 48,577 → 48,777; empty synopsis 5,113 → 4,649)
- **T5** (S7) — Staff / voice-actor audit (read-only) → report → decide. Route: inline. Commit: n/a ✅ (no fix needed, L5)
- **T6** (S1) — Verify, docs, independent verify. Route: gentle-ai-verify. Commit: —

## Log

- **L1** — User: "bueno continuemos con la reconstrucion y mejora de la base de datos usando los datasets y otras fuentes"
- **L2** — Measurements (local DB, read-only): 30,561 anime (all in offline-db, 19,344 in AniList CSV; 73 new titles available). Empty: synopsis 5,113 (AniList fills 470), banner 20,244 (AniList fills 4), year 718, season 2,862, episodes 265, type 26. Disagreements vs AniList: episodes 422, year 304, anilist_id 13; vs offline-db: episodes 88, year 23. Relations vs offline-db: 10,028 missing (both exist), 5,570 extra. manga_character: 194,613 rows, all UPPERCASE (AniList import, no Jikan twin), "Narrator" in 140 mangas, 95,479 synthetic links. character.name_kanji = name: 27,637. staff.anilist_id: 0/66,368. User answers: scope "todo" (all four options); conflicts "Aplicar la mayoría de fuentes"; character_external "Ahora".
- **L3** — T1 design (parent, from explore map + DB checks). Keep `character.mal_id` as the opaque internal key (URLs, 5 cascading FKs, user avatar URLs and public `malId` stay stable). New `character_external` mirrors `anime_external_ids`: `character_id` PK + FK → `character.mal_id` ON DELETE CASCADE; nullable `mal_id`, `anilist_id`, `anidb_id`; timestamps; partial UNIQUE on `mal_id` and on `anilist_id` WHERE NOT NULL. `character.anilist_id` stays (deprecated, no readers) and is dropped in a later migration. Backfill: real rows (< 1e9) → `mal_id = character.mal_id`, `anilist_id = character.anilist_id`; synthetic rows → `mal_id` NULL, `anilist_id = id - 1e9`. DB facts: 105,898 synthetic characters (0 inconsistent); 0 staff ids ≥ 1e9; 27,684 real characters with anilist_id but only 27,172 distinct (34 groups share one) → those keep `anilist_id` NULL in `character_external` and are logged as conflicts; 11,285 twins (real MAL character with anilist_id X while synthetic 1e9+X exists; synthetic still holds 2,449 anime links + 5,708 manga links) → merge the synthetic into the real character: move anime_character / manga_character / character_voice_actor / character_nickname / character_media rows (skip ones already present), then delete the synthetic, all logged so a rollback restores it exactly. App: no character page/sitemap/JSON-LD exists; only fix docs/param names calling the key a "MyAnimeList character id" and the misleading `source: 'myanimelist'` at `anime-character/mapper.ts:91` only if a test proves no behavior change; public field `malId` stays.
- **L4** — T1 applied on the local DB: migration 0016 (table + FK cascade + 2 partial unique indexes, no data). Backfill 265,549 rows; conflicts: shared-anilist 546 rows (34 groups, anilist_id NULL), ambiguous-twin 16 (several real candidates, not merged). Merged 10,775 twins (11,285 minus the 510 in shared groups): moved anime_character 2,851, manga_character 7,847 (2,608 duplicates skipped), voice actors 8 (110 skipped), media 1,021; characters 265,549 → 254,774 = character_external rows; 0 orphans; 0 duplicate external ids; no profile/user image references a deleted synthetic id. Gate: format, check, check:types (0 errors), test (1,041 passed) all exit 0. Rollback order: character-external rollback before any cast-relink rollback. Decision: `source: 'myanimelist'` in anime-character/mapper.ts is left as is — removing it changes the media URL and cache keys (behavior change) for no data gain; the key docs were updated in character.ts.
- **L5** — T5 staff/voice-actor audit (read-only): anime_staff 82,396 rows (13,299 staff, 21,877 anime), roles Title-case MAL vocabulary (13 UPPERCASE rows of 82k); manga_staff 177,563 (17 UPPERCASE). Top staff by anime are plausible real credits (Hatsune Miku as theme performer 219; Li Ni "Planning" on Chinese donghua 197; Oowada Tomoyuki "Producer" 186). character_voice_actor 380,275 rows; top voice actors plausible (Danny Ho 550 Mandarin dubs, Monica Rial 534, Koyasu 505); samples match their series. 1,149 staff name groups are MAL's own homonyms. No sign of the global-name-lookup corruption found in casts, so no fix is applied. Cross-checking VA→anime is not possible locally because anime_staff excludes voice roles.
- **L6** — T4 dry run (real DB): typed AniList relations to insert 200 (194 new pairs; 20,563 already stored; 9,931 offline-db pairs are untyped → report only, so L2's 10,028 overstated what is insertable). Fills: synopsis 466, season 2, episodes 1, year 1 (sources have nothing for the other empties). Majority (AniList + offline-db agree against stored): status 24 (Finished → Currently Airing), season 6, year 6, episodes 3. Exclusions: stored Music type (offline-db cannot express it), stored airing/not-yet-aired for episodes/status, offline-db episodes only from finished entries. Vocabulary: AniList ALTERNATIVE → stored `Alternative setting`; writes use the capitalised MAL relation form.
- **L7** — T2 audit (17,351 manga fetched, 0 errors): keep 96,875 · repoint 86,794 (27,669 create characters) · quarantine 3,291 · pending (empty AniList cast) 4,972 · add 1,161. Defect found before apply: correct real MAL characters with no `anilist_id` (Hinata 64769, Kageyama 64771, Nakashima 50755 in Haikyuu!!) were repointed to their synthetic AniList twins. Fix: derive missing `character_external.anilist_id` from the anime casts — a Jikan-cast (Title-case) MAL character R and an AniList cast entry X of the same anime with a unique normalized-name match ⇒ R ≡ X, kept only when consistent across all of R's anime. Precision check against already-known ids: 27,103 agree, 3 disagree. Adds 59,518 ids; 23,653 of those ids belong to a synthetic twin ⇒ merged by merge-twins. Plan: add the rule to the character-external backfill, roll back T1 locally, re-run backfill + merge-twins, then re-run the manga audit.
