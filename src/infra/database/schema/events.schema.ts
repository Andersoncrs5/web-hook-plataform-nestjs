import {
  pgTable,
  uuid,
  timestamp,
  varchar,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { applications } from "./applications.schema";

export const events = pgTable("events", {

  id: uuid("id")
    .defaultRandom()
    .primaryKey(),

  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' } ),

  eventTypeId: uuid("event_type_id")
    .notNull(),
    
  payload: jsonb("payload")
    .notNull(),

  traceId: varchar("trace_id", {
    length: 255,
  }),

  status: varchar("status", {
    length: 30,
  })
    .notNull(),

  publishedAt: timestamp("published_at"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

}, (table) => [
  index("idx_events_trace_id").on(table.traceId),

  index("idx_events_app_id_status").on(table.applicationId, table.status),

  index("idx_events_app_id_created_at").on(table.applicationId, table.createdAt),
]);
