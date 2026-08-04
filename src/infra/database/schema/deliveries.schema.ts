import { pgTable, uuid, integer, text, index, pgEnum, timestamp } from "drizzle-orm/pg-core";
import { BaseSchema, idPattern, createdAtPattern, updatedAtPattern } from "../schema-helpers";
import { eventsTable } from "./events.schema";

export const deliveryStatus = pgEnum("delivery_status", [
  "PENDING", "PROCESSING", "SUCCESS", "FAILED", "DEAD_LETTER",
]);

export const deliveriesTable = pgTable("deliveries", {
  ...idPattern,

  eventId: uuid("event_id")
    .notNull()
    .references(() => eventsTable.id, { onDelete: 'cascade' }),
  endpointId: uuid("endpoint_id").notNull(),
  status: deliveryStatus("status").default("PROCESSING").notNull(),
  currentAttempt: integer("current_attempt").default(0).notNull(),
  nextRetryAt: timestamp("next_retry_at"),
  lastError: text("last_error"),

  ...createdAtPattern,
  ...updatedAtPattern,
}, (table) => [
  index("idx_deliveries_retry_status").on(table.status, table.nextRetryAt),
  index("idx_deliveries_endpoint_status").on(table.endpointId, table.status),
  index("idx_deliveries_event_id").on(table.eventId),
]);

export class DeliveriesSchema extends BaseSchema {
  readonly table = deliveriesTable;
}