import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {

  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", {
    length: 50
  }).notNull().unique("uk_name_roles"),

  description: varchar("description", {
    length: 255
  }),

  isActive: boolean("is_active").notNull().default(true).notNull(),

  version: integer("version").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),

}, (table) => [
  index("idx_roles_is_active").on(table.isActive),
]);
