import {
  pgTable,
  uuid,
  timestamp,
  varchar,
  boolean,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { applications } from "./applications.schema";

export const eventTypes = pgTable("event_types", {

  id: uuid("id")
    .defaultRandom()
    .primaryKey(),

  applicationId: uuid("application_id").notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),

  name: varchar("name", {
    length: 100,
  }).notNull(),

  description: varchar("description", {
    length: 255,
  }),

  enabled: boolean("enabled")
    .default(true)
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull(),

}, (table) => [
  uniqueIndex("uk_event_types_app_id_name").on(table.applicationId, table.name),

  index("idx_event_types_app_id_enabled").on(table.applicationId, table.enabled),
]);
