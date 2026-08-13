-- Advanced anime search (Stage 1): index-backed free-text.
-- Enables pg_trgm and adds GIN trigram indexes on the searched title columns so
-- ILIKE '%q%' and similarity(title, q) ranking use an index instead of a seq scan.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "anime_title_trgm_idx" ON "anime" USING gin ("title" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "anime_title_english_trgm_idx" ON "anime" USING gin ("title_english" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "anime_title_japanese_trgm_idx" ON "anime" USING gin ("title_japanese" gin_trgm_ops);
