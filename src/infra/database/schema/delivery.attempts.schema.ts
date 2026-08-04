import {
  pgTable,
  uuid,
  timestamp,
  varchar,
  integer,
  text,
  jsonb,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { deliveriesTable } from "./deliveries.schema";

export const deliveryAttempts = pgTable("delivery_attempts", {

  id: uuid("id")
    .defaultRandom()
    .primaryKey(),

  deliveryId: uuid("delivery_id")
    .notNull()
    .references(() => deliveriesTable.id, { onDelete: 'cascade' }),

  attempt: integer("attempt")
    .notNull(),

  requestHeaders: jsonb("request_headers"),

  requestBody: jsonb("request_body"),

  responseStatus: integer("response_status"),

  responseHeaders: jsonb("response_headers"),

  responseBody: text("response_body"),

  durationMs: integer("duration_ms"),

  error: text("error"),

  status: varchar("status", {
    length: 30,
  })
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

}, (table) => [
  uniqueIndex("uk_delivery_attempts_delivery_id_attempt").on(table.deliveryId, table.attempt),

  index("idx_delivery_attempts_status_duration").on(table.status, table.durationMs),
]);
