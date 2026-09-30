import {
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// Rows are keyed by the Clerk user id, so every query must filter on it.

export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey(),
  fullName: text("full_name").notNull().default(""),
  headline: text("headline").notNull().default(""),
  location: text("location").notNull().default(""),
  desiredRoles: text("desired_roles").notNull().default(""),
  skills: text("skills").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jobStatus = pgEnum("job_status", [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
]);

export const savedJobs = pgTable(
  "saved_jobs",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    jobId: text("job_id").notNull(),
    title: text("title").notNull(),
    company: text("company").notNull(),
    location: text("location").notNull().default(""),
    url: text("url").notNull(),
    source: text("source").notNull().default(""),
    salary: text("salary").notNull().default(""),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    status: jobStatus("status").notNull().default("saved"),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("saved_jobs_user_job_idx").on(t.userId, t.jobId),
    index("saved_jobs_user_idx").on(t.userId),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type SavedJob = typeof savedJobs.$inferSelect;
export type JobStatus = (typeof jobStatus.enumValues)[number];
