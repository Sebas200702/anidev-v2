ALTER TABLE "watch_progress" DROP CONSTRAINT "watch_progress_user_id_anime_id_pk";--> statement-breakpoint
ALTER TABLE "watch_progress" ALTER COLUMN "episode_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "watch_progress" ADD CONSTRAINT "watch_progress_user_id_episode_id_pk" PRIMARY KEY("user_id","episode_id");--> statement-breakpoint
ALTER TABLE "watch_progress" ADD COLUMN "episode_number" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "watch_progress" ADD COLUMN "watched_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "watch_progress_watched_at_idx" ON "watch_progress" USING btree ("watched_at");