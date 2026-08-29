import {
  pgTable,
  uuid,
  timestamp,
  integer,
  varchar,
  jsonb,
  index,
  uniqueIndex,
  pgEnum
} from "drizzle-orm/pg-core";
import { organizations } from "./organization.schema";
import { BaseSchema, idPattern, createdAtPattern, updatedAtPattern, deletedAtPattern, versionPattern } from "../schema-helpers";
import { users } from "./user.schema";

export const applicationTypeEnum = pgEnum("application_type", [
  "web",
  "mobile",
  "spa",
  "m2m",
]);

export const applicationEnvironmentEnum = pgEnum("application_environment", [
  "dev",
  "staging",
  "prod",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "active",
  "inactive",
  "pending",
  "archived",
]);

export const applications = pgTable(
  "applications",
  {
    ...idPattern,
    
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    createdBy: uuid("created_by")
      .references(() => users.id, { onDelete: "set null" }),

    name: varchar("name").notNull(),
    slug: varchar("slug").notNull(),

    type: applicationTypeEnum("type").notNull().default("web"),
    environment: applicationEnvironmentEnum("environment").notNull().default("prod"),
    status: applicationStatusEnum("status").notNull().default("active"),
    
    logoUrl: varchar("logo_url", { length: 600 }),
    homepageUrl: varchar("homepage_url", { length: 600 }),

    description: varchar("description"),
    metadata: jsonb("metadata"),

    rateLimit: integer("rate_limit"),

    ...versionPattern,
    ...createdAtPattern,
    ...updatedAtPattern,
    ...deletedAtPattern
  },
  (table) => [
    uniqueIndex("uk_applications_organization_name")
      .on(table.organizationId, table.name),

    uniqueIndex("uk_applications_organization_slug")
      .on(table.organizationId, table.slug),
    
    uniqueIndex("uk_applications_name").on(table.name),
    uniqueIndex("uk_applications_slug").on(table.slug),
  ]
);