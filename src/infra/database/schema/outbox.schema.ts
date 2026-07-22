import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

export const outboxStatus = pgEnum(
  "outbox_status", 
  [
    "PENDING",
    "PROCESSED",
    "FAILED",
  ]
);

export const outbox = pgTable("outbox", {

  id: uuid("id")
    .defaultRandom()
    .primaryKey(),

  aggregate: varchar("aggregate", {
    length: 100,
  })
    .notNull(),

  aggregateId: uuid("aggregate_id")
    .notNull(),

  eventType: varchar("event_type", {
    length: 100,
  })
    .notNull(),

  payload: jsonb("payload")
    .notNull(),

  status: outboxStatus("status")
    .default("PENDING")
    .notNull(),

  processedAt: timestamp("processed_at"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

}, (table) => [
  index("idx_outbox_status_created_at").on(table.status, table.createdAt),

  index("idx_outbox_aggregate_id").on(table.aggregateId),
]);
