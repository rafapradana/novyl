ALTER TABLE "chapters" ADD COLUMN "target_word_count_min" integer DEFAULT 2000;--> statement-breakpoint
ALTER TABLE "chapters" ADD COLUMN "target_word_count_max" integer DEFAULT 3500;--> statement-breakpoint
ALTER TABLE "novels" ADD COLUMN "blurb" text;--> statement-breakpoint
ALTER TABLE "novels" ADD COLUMN "generation_status" text DEFAULT 'idle';--> statement-breakpoint
ALTER TABLE "novels" ADD COLUMN "workflow_run_id" text;--> statement-breakpoint
CREATE INDEX "novel_generation_status_idx" ON "novels" USING btree ("generation_status");