import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  integer,
  text,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const jobStatus = pgEnum(
  "job_status",
  [
    "PENDING",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
  ]
);

export const scheduledJobs = pgTable("scheduled_jobs", {

  id: uuid("id")
    .defaultRandom()
    .primaryKey(),

  jobName: varchar("job_name", {
    length: 150,
  })
    .notNull(),

  payload: jsonb("payload"),

  runAt: timestamp("run_at")
    .notNull(),

  attempts: integer("attempts")
    .default(0)
    .notNull(),

  status: jobStatus("status")
    .default("PENDING")
    .notNull(),

  lastError: text("last_error"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),

}, (table) => [
  index("idx_scheduled_jobs_status_run_at").on(table.status, table.runAt),
  index("idx_scheduled_jobs_name").on(table.jobName),
]);
