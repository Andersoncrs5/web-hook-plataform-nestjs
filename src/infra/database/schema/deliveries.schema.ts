import {
  pgTable,
  uuid,
  timestamp,
  varchar,
  integer,
  text,
  index,
} from "drizzle-orm/pg-core";
import { events } from "./events.schema";
import { pgEnum } from "drizzle-orm/pg-core";

export const deliveryStatus = pgEnum("delivery_status", [
  "PENDING",
  "PROCESSING",
  "SUCCESS",
  "FAILED",
  "DEAD_LETTER",
]);

export const deliveries = pgTable("deliveries", {

  id: uuid("id")
    .defaultRandom()
    .primaryKey(),

  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' } ),

  endpointId: uuid("endpoint_id")
    .notNull(),
    
  status: deliveryStatus("status").default("PROCESSING").notNull(),

  currentAttempt: integer("current_attempt")
    .default(0)
    .notNull(),

  nextRetryAt: timestamp("next_retry_at"),

  lastError: text("last_error"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),

}, (table) => [
  index("idx_deliveries_retry_status").on(table.status, table.nextRetryAt),

  index("idx_deliveries_endpoint_status").on(table.endpointId, table.status),

  index("idx_deliveries_event_id").on(table.eventId),
]);
