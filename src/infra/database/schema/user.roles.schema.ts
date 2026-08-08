import {
  pgTable,
  uuid,
  timestamp,
  integer,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { users } from "./user.schema";
import { roles } from "./roles.schema";

import { BaseSchema, idPattern, createdAtPattern, updatedAtPattern, versionPattern, deletedAtPattern } from "../schema-helpers";

export const userRoles = pgTable(
  "user_roles",
  {
    ...idPattern, 

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),

    ...versionPattern,
    ...createdAtPattern,
    ...updatedAtPattern,
    ...deletedAtPattern,
  },
  (table) => [
    uniqueIndex("uk_user_roles_user_id_role_id").on(table.userId, table.roleId),

    index("idx_user_roles_role_id_user_id").on(table.roleId, table.userId),
  ]
);

export class UserRolesSchema extends BaseSchema {
  readonly table = userRoles
}