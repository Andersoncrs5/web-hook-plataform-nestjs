import {
  pgTable,
  uuid,
  varchar,
  boolean,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { applications } from "./applications.schema";
import { BaseSchema, idPattern, createdAtPattern, updatedAtPattern, deletedAtPattern, versionPattern } from "../schema-helpers";


export const eventTypes = pgTable("event_types", {

  ...idPattern,

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

  ...versionPattern,
  ...createdAtPattern,
  ...updatedAtPattern,
  ...deletedAtPattern

}, (table) => [
  uniqueIndex("uk_event_types_app_id_name").on(table.applicationId, table.name),

  index("idx_event_types_app_id_enabled").on(table.applicationId, table.enabled),
]);
