import {
  pgTable,
  uuid,
  timestamp,
  integer,
  varchar,
  jsonb,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { organizations } from "./organization.schema";

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    name: varchar("name").notNull(),
    slug: varchar("slug").notNull(),
    version: integer("version").default(0).notNull(),
    description: varchar("description"),
    metadata: jsonb("metadata"),
    status: varchar("status").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("idx_applications_name").on(table.name),
    index("idx_applications_slug").on(table.slug),
    
    uniqueIndex("uk_applications_name").on(table.name),
    uniqueIndex("uk_applications_slug").on(table.slug),
  ]
);
