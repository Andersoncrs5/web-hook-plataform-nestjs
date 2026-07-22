import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  integer,
  text,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { applications } from "./applications.schema";

export const webhookEndpoints = pgTable("webhook_endpoints", {

  id: uuid("id")
    .defaultRandom()
    .primaryKey(),

  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),

  url: text("url")
    .notNull(),

  secret: text("secret")
    .notNull(),

  description: varchar("description", {
    length: 255,
  }),

  version: integer("version")
    .default(0)
    .notNull(),

  enabled: boolean("enabled")
    .default(true)
    .notNull(),

  timeoutMs: integer("timeout_ms")
    .default(5000)
    .notNull(),

  headers: jsonb("headers"),

  maxRetry: integer("max_retry")
    .default(5)
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),

  deletedAt: timestamp("deleted_at"),

}, (table) => [
  index("idx_webhook_endpoints_application_id").on(table.applicationId),

  index("idx_webhook_endpoints_app_enabled").on(table.applicationId, table.enabled),
]);
