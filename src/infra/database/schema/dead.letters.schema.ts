import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { deliveries } from "./deliveries.schema"; 

export const deadLetters = pgTable("dead_letters", {

  id: uuid("id")
    .defaultRandom()
    .primaryKey(),

  deliveryId: uuid("delivery_id")
    .notNull()
    .references(() => deliveries.id, { onDelete: 'cascade' }),

  reason: text("reason")
    .notNull(),

  payload: jsonb("payload"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

}, (table) => [
  uniqueIndex("uk_dead_letters_delivery_id").on(table.deliveryId),

  index("idx_dead_letters_reason_created_at").on(table.reason, table.createdAt),
]);
