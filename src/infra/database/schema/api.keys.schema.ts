import {
  pgTable,
  uuid,
  timestamp,
  integer,
  boolean,
  varchar,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { idPattern, createdAtPattern, updatedAtPattern, deletedAtPattern, versionPattern } from "../schema-helpers";
import { applications } from "./applications.schema";


export const apiKeys = pgTable(
  "api_keys",
  {
    ...idPattern,

    applicationId: uuid("application_id")
        .notNull()
        .references(() => applications.id, {
          onDelete: "cascade",
        }),


    name: varchar("name").notNull(),

    keyHash: varchar("key_hash").notNull(),

    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),

    enabled: boolean("enabled").default(true).notNull(),

    ...versionPattern,
    ...createdAtPattern,
    ...updatedAtPattern,
    ...deletedAtPattern

  }, 
  (table) => [
    index("idx_name_api_key").on(table.name),
    uniqueIndex("uk_name_api_key").on(table.name),
    
    index("idx_hash_api_key").on(table.keyHash),
    uniqueIndex("uk_hash_api_key").on(table.keyHash), 
  ]
);
