import {
  pgTable,
  varchar,
  jsonb,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { BaseSchema, idPattern, createdAtPattern, deletedAtPattern, updatedAtPattern, versionPattern } from "../schema-helpers";

export const inboxStatus = pgEnum(
  "inbox_status", 
  [
    "PENDING",
    "PROCESSED",
    "FAILED",
  ]
);

export const inbox = pgTable("inbox", {

  ...idPattern,

  source: varchar("source", {
    length: 100,
  }).notNull(),

  messageId: varchar("message_id", {
    length: 255,
  }).notNull(),

  payload: varchar("payload", { length: 1000 }),

  status: inboxStatus("status")
    .default("PENDING")
    .notNull(),

  processedAt: timestamp("processed_at"),

  ...createdAtPattern,
  ...versionPattern,
  ...deletedAtPattern,
  ...updatedAtPattern,

}, (table) => [
  uniqueIndex("uk_inbox_source_message_id").on(table.source, table.messageId),
  index("idx_inbox_status_created_at").on(table.status, table.createdAt),
]);


export class InboxSchema extends BaseSchema {
  readonly table = inbox;
}