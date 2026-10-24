CREATE INDEX "manga_title_trgm_idx" ON "manga" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "manga_title_english_trgm_idx" ON "manga" USING gin ("title_english" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "manga_title_japanese_trgm_idx" ON "manga" USING gin ("title_japanese" gin_trgm_ops);