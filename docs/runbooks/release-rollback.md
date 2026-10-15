# Runbook: release rollback

## Rule

Releases ship on the feature branch *before* merging (`bun run release:*`),
so every merge carries its `chore(release):` bump + tag. Roll back by
redeploying the previous image tag — never by reverting migrations.

## Roll back a deploy

```bash
# Tags are :<version>, :latest, :<sha> (see release.yml)
docker pull <user>/anidev-v2:<previous-version>
# point the runtime at <previous-version> and restart
```

## Migrations

Migrations in this repo are **additive-only** (indexes, new tables/columns,
unique indexes after a duplicate pre-check). Rolling back the image never
requires rolling back the schema: old code runs fine against additive
changes. Destructive DDL is out of scope for agents — the maintainer performs
it manually outside this repo.

## After rollback

1. Confirm `/api/health/readiness` is 200.
2. Watch the 5xx-rate alert (15 min).
3. File a follow-up: root-cause + re-release plan.
