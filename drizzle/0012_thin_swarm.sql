CREATE TABLE "user_anime_list" (
	"user_id" text NOT NULL,
	"anime_id" integer NOT NULL,
	"status" text DEFAULT 'plan_to_watch' NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"score" real,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_anime_list_user_id_anime_id_pk" PRIMARY KEY("user_id","anime_id")
);
--> statement-breakpoint
CREATE TABLE "watch_progress" (
	"user_id" text NOT NULL,
	"anime_id" integer NOT NULL,
	"episode_id" integer,
	"progress_seconds" integer DEFAULT 0 NOT NULL,
	"duration_seconds" integer,
	"completed" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watch_progress_user_id_anime_id_pk" PRIMARY KEY("user_id","anime_id")
);
--> statement-breakpoint
ALTER TABLE "user_anime_list" ADD CONSTRAINT "user_anime_list_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_anime_list" ADD CONSTRAINT "user_anime_list_anime_id_anime_mal_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_progress" ADD CONSTRAINT "watch_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_progress" ADD CONSTRAINT "watch_progress_anime_id_anime_mal_id_fk" FOREIGN KEY ("anime_id") REFERENCES "public"."anime"("mal_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_progress" ADD CONSTRAINT "watch_progress_episode_id_episode_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episode"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_anime_list_user_id_idx" ON "user_anime_list" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_anime_list_anime_id_idx" ON "user_anime_list" USING btree ("anime_id");--> statement-breakpoint
CREATE INDEX "user_anime_list_status_idx" ON "user_anime_list" USING btree ("status");--> statement-breakpoint
CREATE INDEX "watch_progress_user_id_idx" ON "watch_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "watch_progress_anime_id_idx" ON "watch_progress" USING btree ("anime_id");--> statement-breakpoint
CREATE INDEX "watch_progress_episode_id_idx" ON "watch_progress" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "watch_progress_updated_at_idx" ON "watch_progress" USING btree ("updated_at");