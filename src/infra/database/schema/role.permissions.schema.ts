import {
  pgTable,
  uuid,
  timestamp,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { roles } from "./roles.schema";
import { permissions } from "./permission.schema";
import { BaseSchema, idPattern, createdAtPattern, updatedAtPattern, deletedAtPattern, versionPattern } from "../schema-helpers";


export const rolePermissions = pgTable(
  "role_permissions",
  {
    ...idPattern,


    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),

    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),

    ...versionPattern,
    ...createdAtPattern,
    ...updatedAtPattern,
    ...deletedAtPattern
  },
  (table) => [
    uniqueIndex("uk_role_permissions_role_id_permission_id").on(table.roleId, table.permissionId),

    index("idx_role_permissions_permission_id_role_id").on(table.permissionId, table.roleId),
  ]
);
