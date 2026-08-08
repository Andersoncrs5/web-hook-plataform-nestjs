import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { deliveriesTable } from "./deliveries.schema"; 
import { BaseSchema, idPattern, createdAtPattern, updatedAtPattern, deletedAtPattern, versionPattern } from "../schema-helpers";

export const deadLetters = pgTable("dead_letters", {
  ...idPattern,


  deliveryId: uuid("delivery_id")
    .notNull()
    .references(() => deliveriesTable.id, { onDelete: 'cascade' }),

  reason: text("reason")
    .notNull(),

  payload: jsonb("payload"),

  ...versionPattern,
  ...createdAtPattern,
  ...updatedAtPattern,
  ...deletedAtPattern

}, (table) => [
  uniqueIndex("uk_dead_letters_delivery_id").on(table.deliveryId),

  index("idx_dead_letters_reason_created_at").on(table.reason, table.createdAt),
]);
