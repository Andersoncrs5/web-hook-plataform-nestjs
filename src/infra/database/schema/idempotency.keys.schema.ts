import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { applications } from "./applications.schema"; 

export const idempotencyKeys = pgTable("idempotency_keys", {

  id: uuid("id")
    .defaultRandom()
    .primaryKey(),

  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),

  key: varchar("key", {
    length: 255,
  })
    .notNull(),

  requestHash: text("request_hash")
    .notNull(),

  response: jsonb("response"),

  expiresAt: timestamp("expires_at"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

}, (table) => [
  uniqueIndex("uk_idempotency_keys_app_id_key").on(table.applicationId, table.key),

  index("idx_idempotency_keys_expires_at").on(table.expiresAt),
]);
