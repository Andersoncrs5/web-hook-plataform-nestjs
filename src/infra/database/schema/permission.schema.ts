import {
  pgTable,
  uuid,
  timestamp,
  integer,
  varchar,
  boolean,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";

export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  name: varchar("name").notNull().unique("uk_name_permission"),
  
  description: varchar("description"),
  
  resource: varchar("resource").notNull(),
  
  action: varchar("action").notNull(),
  
  isActive: boolean("is_active").default(true).notNull(),
  
  version: integer("version").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_permissions_resource_action").on(table.resource, table.action),
  
  index("idx_permissions_is_active").on(table.isActive),
]);
