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
import { BaseSchema, idPattern, createdAtPattern, updatedAtPattern, deletedAtPattern, versionPattern } from "../schema-helpers";


export const permissions = pgTable("permissions", {
  ...idPattern,
  
  name: varchar("name").notNull().unique("uk_name_permission"),
  
  description: varchar("description"),
  
  resource: varchar("resource").notNull(),
  
  action: varchar("action").notNull(),
  
  isActive: boolean("is_active").default(true).notNull(),
  
  ...versionPattern,
  ...createdAtPattern,
  ...updatedAtPattern,
  ...deletedAtPattern
}, (table) => [
  index("idx_permissions_resource_action").on(table.resource, table.action),
  
  index("idx_permissions_is_active").on(table.isActive),
]);
