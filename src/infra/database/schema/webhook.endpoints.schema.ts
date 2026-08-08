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
import { BaseSchema, idPattern, createdAtPattern, updatedAtPattern, deletedAtPattern, versionPattern } from "../schema-helpers";

export const webhookEndpoints = pgTable("webhook_endpoints", {
  ...idPattern,

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

  ...versionPattern,
  ...createdAtPattern,
  ...updatedAtPattern,
  ...deletedAtPattern

}, (table) => [
  index("idx_webhook_endpoints_application_id").on(table.applicationId),

  index("idx_webhook_endpoints_app_enabled").on(table.applicationId, table.enabled),
]);
