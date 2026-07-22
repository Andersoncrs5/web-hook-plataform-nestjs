import {
  pgTable,
  uuid,
  timestamp,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { roles } from "./roles.schemas";
import { permissions } from "./permission.schema";

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),

    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uk_role_permissions_role_id_permission_id").on(table.roleId, table.permissionId),

    index("idx_role_permissions_permission_id_role_id").on(table.permissionId, table.roleId),
  ]
);
