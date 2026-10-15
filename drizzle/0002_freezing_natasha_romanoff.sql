ALTER TABLE "anime_music" DROP CONSTRAINT "anime_music_anime_id_anime_mal_id_fk";
--> statement-breakpoint
ALTER TABLE "anime_music" DROP CONSTRAINT "anime_music_music_id_music_id_fk";
--> statement-breakpoint
ALTER TABLE "anime_relation" DROP CONSTRAINT "anime_relation_anime_id_anime_mal_id_fk";
--> statement-breakpoint
ALTER TABLE "anime_relation" DROP CONSTRAINT "anime_relation_related_anime_id_anime_mal_id_fk";
--> statement-breakpoint
ALTER TABLE "music_artist" DROP CONSTRAINT "music_artist_music_id_music_id_fk";
--> statement-breakpoint
ALTER TABLE "music_artist" DROP CONSTRAINT "music_artist_artist_id_artist_id_fk";
--> statement-breakpoint
ALTER TABLE "anime_music" ADD CONSTRAINT "anime_music_anime_id_anime_mal_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_music" ADD CONSTRAINT "anime_music_music_id_music_id_fk" FOREIGN KEY ("music_id") REFERENCES "public"."music"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_relation" ADD CONSTRAINT "anime_relation_anime_id_anime_mal_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_relation" ADD CONSTRAINT "anime_relation_related_anime_id_anime_mal_id_fk" FOREIGN KEY ("related_anime_id") REFERENCES "public"."anime"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_artist" ADD CONSTRAINT "music_artist_music_id_music_id_fk" FOREIGN KEY ("music_id") REFERENCES "public"."music"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_artist" ADD CONSTRAINT "music_artist_artist_id_artist_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "anime_year_idx" ON "anime" USING btree ("year");--> statement-breakpoint
CREATE INDEX "anime_season_idx" ON "anime" USING btree ("season");--> statement-breakpoint
CREATE INDEX "anime_score_idx" ON "anime" USING btree ("score");--> statement-breakpoint
CREATE INDEX "anime_status_idx" ON "anime" USING btree ("status");--> statement-breakpoint
CREATE INDEX "anime_type_idx" ON "anime" USING btree ("type");--> statement-breakpoint
CREATE INDEX "anime_rating_idx" ON "anime" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "anime_media_anime_id_type_idx" ON "anime_media" USING btree ("anime_id","media_type");--> statement-breakpoint
CREATE INDEX "anime_title_synonym_title_trgm_idx" ON "anime_title_synonym" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "character_media_character_id_type_idx" ON "character_media" USING btree ("character_id","media_type");--> statement-breakpoint
CREATE INDEX "episode_media_episode_id_type_idx" ON "episode_media" USING btree ("episode_id","media_type");--> statement-breakpoint
CREATE INDEX "genre_name_idx" ON "genre" USING btree ("name");--> statement-breakpoint
CREATE INDEX "music_media_music_id_type_idx" ON "music_media" USING btree ("music_id","media_type");--> statement-breakpoint
CREATE INDEX "music_resolution_version_id_idx" ON "music_resolution" USING btree ("music_version_id");--> statement-breakpoint
CREATE INDEX "music_version_music_id_idx" ON "music_version" USING btree ("music_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profile_user_id_unique" ON "profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "staff_media_staff_id_type_idx" ON "staff_media" USING btree ("staff_id","media_type");