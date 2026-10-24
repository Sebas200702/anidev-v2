CREATE INDEX IF NOT EXISTS "anime_character_character_id_idx" ON "anime_character" USING btree ("character_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "anime_staff_staff_id_idx" ON "anime_staff" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "artist_mal_id_idx" ON "artist" USING btree ("mal_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "character_name_trgm_idx" ON "character" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "character_name_kanji_trgm_idx" ON "character" USING gin ("name_kanji" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "character_voice_actor_staff_id_idx" ON "character_voice_actor" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "music_artist_artist_id_idx" ON "music_artist" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "staff_name_trgm_idx" ON "staff" USING gin ("name" gin_trgm_ops);