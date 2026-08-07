CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anime" (
	"mal_id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"title_english" text,
	"title_japanese" text,
	"type" text,
	"status" text,
	"episodes" integer,
	"score" real,
	"scored_by" integer,
	"popularity_rank" integer,
	"rating" text,
	"year" integer,
	"season" text,
	"synopsis" text,
	"background" text
);
--> statement-breakpoint
CREATE TABLE "anime_character" (
	"anime_id" integer NOT NULL,
	"character_id" integer NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "anime_character_anime_id_character_id_role_pk" PRIMARY KEY("anime_id","character_id","role")
);
--> statement-breakpoint
CREATE TABLE "anime_demographic" (
	"anime_id" integer NOT NULL,
	"demographic_id" integer NOT NULL,
	CONSTRAINT "anime_demographic_anime_id_demographic_id_pk" PRIMARY KEY("anime_id","demographic_id")
);
--> statement-breakpoint
CREATE TABLE "anime_external_ids" (
	"anime_id" integer PRIMARY KEY NOT NULL,
	"anime_themes_slug" text,
	"kitsu_id" integer,
	"tvdb_id" integer,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "anime_genre" (
	"anime_id" integer NOT NULL,
	"genre_id" integer NOT NULL,
	CONSTRAINT "anime_genre_anime_id_genre_id_pk" PRIMARY KEY("anime_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "anime_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"anime_id" integer NOT NULL,
	"media_type" text NOT NULL,
	"src" text NOT NULL,
	"size" text
);
--> statement-breakpoint
CREATE TABLE "anime_music" (
	"anime_id" integer NOT NULL,
	"music_id" integer NOT NULL,
	CONSTRAINT "anime_music_anime_id_music_id_pk" PRIMARY KEY("anime_id","music_id")
);
--> statement-breakpoint
CREATE TABLE "anime_producer" (
	"anime_id" integer NOT NULL,
	"producer_id" integer NOT NULL,
	CONSTRAINT "anime_producer_anime_id_producer_id_pk" PRIMARY KEY("anime_id","producer_id")
);
--> statement-breakpoint
CREATE TABLE "anime_relation" (
	"anime_id" integer NOT NULL,
	"relation_type" text NOT NULL,
	"related_anime_id" integer NOT NULL,
	CONSTRAINT "anime_relation_anime_id_related_anime_id_relation_type_pk" PRIMARY KEY("anime_id","related_anime_id","relation_type")
);
--> statement-breakpoint
CREATE TABLE "anime_staff" (
	"anime_id" integer NOT NULL,
	"staff_id" integer NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "anime_staff_anime_id_staff_id_role_pk" PRIMARY KEY("anime_id","staff_id","role")
);
--> statement-breakpoint
CREATE TABLE "anime_theme" (
	"anime_id" integer NOT NULL,
	"theme_id" integer NOT NULL,
	CONSTRAINT "anime_theme_anime_id_theme_id_pk" PRIMARY KEY("anime_id","theme_id")
);
--> statement-breakpoint
CREATE TABLE "anime_title_synonym" (
	"id" serial PRIMARY KEY NOT NULL,
	"anime_id" integer NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artist" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"mal_id" integer
);
--> statement-breakpoint
CREATE TABLE "character" (
	"mal_id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_kanji" text,
	"about" text
);
--> statement-breakpoint
CREATE TABLE "character_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"media_type" text NOT NULL,
	"src" text NOT NULL,
	"size" text
);
--> statement-breakpoint
CREATE TABLE "character_nickname" (
	"id" serial PRIMARY KEY NOT NULL,
	"character_id" integer NOT NULL,
	"nickname" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "character_voice_actor" (
	"character_id" integer NOT NULL,
	"staff_id" integer NOT NULL,
	"language" text NOT NULL,
	CONSTRAINT "character_voice_actor_character_id_staff_id_language_pk" PRIMARY KEY("character_id","staff_id","language")
);
--> statement-breakpoint
CREATE TABLE "demographic" (
	"mal_id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "episode" (
	"id" serial PRIMARY KEY NOT NULL,
	"anime_id" integer NOT NULL,
	"title" text NOT NULL,
	"synopsis" text,
	"duration" text,
	"aired" text,
	"number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "episode_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"episode_id" integer NOT NULL,
	"media_type" text NOT NULL,
	"src" text NOT NULL,
	"size" text
);
--> statement-breakpoint
CREATE TABLE "episode_source" (
	"id" serial PRIMARY KEY NOT NULL,
	"episode_id" integer NOT NULL,
	"src" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "episode_subtitle" (
	"id" serial PRIMARY KEY NOT NULL,
	"episode_id" integer NOT NULL,
	"language" text NOT NULL,
	"src" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "genre" (
	"mal_id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "music_artist" (
	"music_id" integer NOT NULL,
	"artist_id" integer NOT NULL,
	CONSTRAINT "music_artist_music_id_artist_id_pk" PRIMARY KEY("music_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "music_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"music_id" integer NOT NULL,
	"media_type" text NOT NULL,
	"src" text NOT NULL,
	"size" text
);
--> statement-breakpoint
CREATE TABLE "music_resolution" (
	"id" serial PRIMARY KEY NOT NULL,
	"music_version_id" integer NOT NULL,
	"song_id" integer NOT NULL,
	"resolution" text NOT NULL,
	"audio_url" text,
	"video_url" text
);
--> statement-breakpoint
CREATE TABLE "music_version" (
	"id" serial PRIMARY KEY NOT NULL,
	"music_id" integer NOT NULL,
	"version" integer NOT NULL,
	"version_id" integer NOT NULL,
	CONSTRAINT "music_version_version_id_unique" UNIQUE("version_id")
);
--> statement-breakpoint
CREATE TABLE "producer" (
	"mal_id" integer PRIMARY KEY NOT NULL,
	"established" text,
	"about" text,
	"count" integer
);
--> statement-breakpoint
CREATE TABLE "producer_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"producer_id" integer NOT NULL,
	"media_type" text NOT NULL,
	"src" text NOT NULL,
	"size" text
);
--> statement-breakpoint
CREATE TABLE "producer_title" (
	"id" serial PRIMARY KEY NOT NULL,
	"producer_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"avatar" text,
	"name" text NOT NULL,
	"last_name" text NOT NULL,
	"birthday" text,
	"gender" text,
	"favorite_animes" text,
	"favorite_genres" text,
	"favorite_studios" text,
	"frequency" text,
	"fanatic_level" text,
	"preferred_format" text,
	"watched_animes" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"mal_id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"given_name" text,
	"family_name" text,
	"birthday" text,
	"about" text
);
--> statement-breakpoint
CREATE TABLE "staff_alternative_name" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"staff_id" integer NOT NULL,
	"media_type" text NOT NULL,
	"src" text NOT NULL,
	"size" text
);
--> statement-breakpoint
CREATE TABLE "theme" (
	"mal_id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_character" ADD CONSTRAINT "anime_character_anime_id_anime_mal_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_character" ADD CONSTRAINT "anime_character_character_id_character_mal_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_demographic" ADD CONSTRAINT "anime_demographic_anime_id_anime_mal_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_demographic" ADD CONSTRAINT "anime_demographic_demographic_id_demographic_mal_id_fk" FOREIGN KEY ("demographic_id") REFERENCES "public"."demographic"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_external_ids" ADD CONSTRAINT "anime_external_ids_anime_id_anime_mal_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("mal_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_genre" ADD CONSTRAINT "anime_genre_anime_id_anime_mal_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_genre" ADD CONSTRAINT "anime_genre_genre_id_genre_mal_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genre"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_media" ADD CONSTRAINT "anime_media_anime_id_anime_mal_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_music" ADD CONSTRAINT "anime_music_anime_id_anime_mal_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("mal_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_music" ADD CONSTRAINT "anime_music_music_id_music_id_fk" FOREIGN KEY ("music_id") REFERENCES "public"."music"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_producer" ADD CONSTRAINT "anime_producer_anime_id_anime_mal_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_producer" ADD CONSTRAINT "anime_producer_producer_id_producer_mal_id_fk" FOREIGN KEY ("producer_id") REFERENCES "public"."producer"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_relation" ADD CONSTRAINT "anime_relation_anime_id_anime_mal_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("mal_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_relation" ADD CONSTRAINT "anime_relation_related_anime_id_anime_mal_id_fk" FOREIGN KEY ("related_anime_id") REFERENCES "public"."anime"("mal_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_staff" ADD CONSTRAINT "anime_staff_anime_id_anime_mal_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_staff" ADD CONSTRAINT "anime_staff_staff_id_staff_mal_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_theme" ADD CONSTRAINT "anime_theme_anime_id_anime_mal_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_theme" ADD CONSTRAINT "anime_theme_theme_id_theme_mal_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."theme"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anime_title_synonym" ADD CONSTRAINT "anime_title_synonym_anime_id_anime_mal_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist" ADD CONSTRAINT "artist_mal_id_staff_mal_id_fk" FOREIGN KEY ("mal_id") REFERENCES "public"."staff"("mal_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_media" ADD CONSTRAINT "character_media_character_id_character_mal_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_nickname" ADD CONSTRAINT "character_nickname_character_id_character_mal_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_voice_actor" ADD CONSTRAINT "character_voice_actor_character_id_character_mal_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."character"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_voice_actor" ADD CONSTRAINT "character_voice_actor_staff_id_staff_mal_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode" ADD CONSTRAINT "episode_anime_id_anime_mal_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode_media" ADD CONSTRAINT "episode_media_episode_id_episode_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episode"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode_source" ADD CONSTRAINT "episode_source_episode_id_episode_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episode"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode_subtitle" ADD CONSTRAINT "episode_subtitle_episode_id_episode_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episode"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_artist" ADD CONSTRAINT "music_artist_music_id_music_id_fk" FOREIGN KEY ("music_id") REFERENCES "public"."music"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_artist" ADD CONSTRAINT "music_artist_artist_id_artist_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artist"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_media" ADD CONSTRAINT "music_media_music_id_music_id_fk" FOREIGN KEY ("music_id") REFERENCES "public"."music"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_resolution" ADD CONSTRAINT "music_resolution_music_version_id_music_version_version_id_fk" FOREIGN KEY ("music_version_id") REFERENCES "public"."music_version"("version_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "music_version" ADD CONSTRAINT "music_version_music_id_music_id_fk" FOREIGN KEY ("music_id") REFERENCES "public"."music"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producer_media" ADD CONSTRAINT "producer_media_producer_id_producer_mal_id_fk" FOREIGN KEY ("producer_id") REFERENCES "public"."producer"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producer_title" ADD CONSTRAINT "producer_title_producer_id_producer_mal_id_fk" FOREIGN KEY ("producer_id") REFERENCES "public"."producer"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_alternative_name" ADD CONSTRAINT "staff_alternative_name_staff_id_staff_mal_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_media" ADD CONSTRAINT "staff_media_staff_id_staff_mal_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "anime_title_synonym_anime_id_title_idx" ON "anime_title_synonym" USING btree ("anime_id","title");--> statement-breakpoint
CREATE UNIQUE INDEX "artist_name_unique" ON "artist" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "character_nickname_unique" ON "character_nickname" USING btree ("character_id","nickname");--> statement-breakpoint
CREATE UNIQUE INDEX "episode_anime_number_unique" ON "episode" USING btree ("anime_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "episode_source_unique" ON "episode_source" USING btree ("episode_id","src");--> statement-breakpoint
CREATE UNIQUE INDEX "episode_subtitle_unique" ON "episode_subtitle" USING btree ("episode_id","language","src");--> statement-breakpoint
CREATE UNIQUE INDEX "music_resolution_song_res_unique" ON "music_resolution" USING btree ("song_id","resolution");--> statement-breakpoint
CREATE UNIQUE INDEX "producer_title_unique" ON "producer_title" USING btree ("producer_id","title");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_alt_name_unique" ON "staff_alternative_name" USING btree ("staff_id","name");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");