import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./user.schema";
import {
  BaseSchema,
  idPattern,
  createdAtPattern,
  updatedAtPattern,
  versionPattern,
  deletedAtPattern,
} from "../schema-helpers";

export const organizationStatus = pgEnum(
  "organization_status",
  [
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED",
  ]
);

export const organizations = pgTable("organizations", {

  ...idPattern,

  name: varchar("name", {
    length: 150
  }).notNull().unique('uk_name_organization'),

  slug: varchar("slug", {
    length: 100
  }).notNull().unique('uk_slug_organization'),

  status: organizationStatus("status") 
    .default("ACTIVE")
    .notNull(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' } ),

  metadata: jsonb("metadata"),

  ...versionPattern,
    ...createdAtPattern,
    ...updatedAtPattern,
    ...deletedAtPattern,

}, (table) => [
  index("idx_organizations_slug").on(table.slug),
  index("idx_organizations_user_id").on(table.userId),
]);
