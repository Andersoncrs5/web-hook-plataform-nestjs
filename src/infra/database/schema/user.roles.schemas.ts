import {
  pgTable,
  uuid,
  timestamp,
  integer,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { users } from "./user.schema";
import { roles } from "./roles.schemas";

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),

    version: integer("version")
      .default(0)
      .notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uk_user_roles_user_id_role_id").on(table.userId, table.roleId),

    index("idx_user_roles_role_id_user_id").on(table.roleId, table.userId),
  ]
);
