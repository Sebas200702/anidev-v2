## 1. Break the auth schema circular import

- [x] 1.1 Remove the trailing relations re-export block (lines 145-149) from `src/lib/db/schemas/auth-schema.ts`
- [x] 1.2 Split the auth export in `src/lib/db/schemas/index.ts`: tables from `./auth-schema`, relations from `./auth-relations`
- [x] 1.3 Update the `@module` doc blocks to reflect the new dependency direction (`auth-schema` no longer re-exports relations; `index.ts` sources relations from `auth-relations`)

## 2. Verify and release

- [x] 2.1 Confirm no other file imports the relations from `auth-schema` (grep) and the public export surface is unchanged
- [x] 2.2 Run the Verification gate and build with `ASTRO_ADAPTER=bun`, confirming the produced chunk orders `const user` before the `relations(user, ...)` calls
- [x] 2.3 Open a PR to `master` on branch `fix/auth-schema-circular-import`, run `bun run release:patch` on the branch, merge, and push the tag to rebuild the Docker image
