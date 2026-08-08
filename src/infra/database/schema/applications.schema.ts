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
import { BaseSchema, idPattern, createdAtPattern, updatedAtPattern, deletedAtPattern, versionPattern } from "../schema-helpers";

export const applications = pgTable(
  "applications",
  {
    ...idPattern,
    
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    name: varchar("name").notNull(),
    slug: varchar("slug").notNull(),
    
    description: varchar("description"),
    metadata: jsonb("metadata"),
    status: varchar("status").notNull(),

    ...versionPattern,
    ...createdAtPattern,
    ...updatedAtPattern,
    ...deletedAtPattern
  },
  (table) => [
    index("idx_applications_name").on(table.name),
    index("idx_applications_slug").on(table.slug),
    
    uniqueIndex("uk_applications_name").on(table.name),
    uniqueIndex("uk_applications_slug").on(table.slug),
  ]
);
