CREATE TYPE "public"."job_status" AS ENUM('saved', 'applied', 'interview', 'offer', 'rejected');--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"full_name" text DEFAULT '' NOT NULL,
	"headline" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"desired_roles" text DEFAULT '' NOT NULL,
	"skills" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"job_id" text NOT NULL,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"url" text NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"salary" text DEFAULT '' NOT NULL,
	"posted_at" timestamp with time zone,
	"status" "job_status" DEFAULT 'saved' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "saved_jobs_user_job_idx" ON "saved_jobs" USING btree ("user_id","job_id");--> statement-breakpoint
CREATE INDEX "saved_jobs_user_idx" ON "saved_jobs" USING btree ("user_id");