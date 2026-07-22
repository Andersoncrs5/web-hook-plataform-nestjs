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

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    applicationId: uuid("application_id").notNull(),

    name: varchar("name").notNull(),

    keyHash: varchar("key_hash").notNull(),

    lastUsedAt: timestamp("last_used_at"),

    version: integer("version").default(0).notNull(),

    expiresAt: timestamp("expires_at"),

    enabled: boolean("enabled").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),

  }, 
  (table) => [
    index("idx_name_api_key").on(table.name),
    uniqueIndex("uk_name_api_key").on(table.name),
    
    index("idx_hash_api_key").on(table.keyHash),
    uniqueIndex("uk_hash_api_key").on(table.keyHash), 
  ]
);
