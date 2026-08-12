import {
  pgTable,
  varchar,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { BaseSchema, idPattern, createdAtPattern, updatedAtPattern, deletedAtPattern, versionPattern } from "../schema-helpers";


export const roles = pgTable("roles", {

  ...idPattern,

  name: varchar("name", {
    length: 50
  }).notNull().unique("uk_name_roles"),

  description: varchar("description", {
    length: 255
  }),

  isActive: boolean("is_active").notNull().default(true).notNull(),

  ...versionPattern,
  ...createdAtPattern,
  ...updatedAtPattern,
  ...deletedAtPattern

}, (table) => [
  index("idx_roles_is_active").on(table.isActive),
]);
