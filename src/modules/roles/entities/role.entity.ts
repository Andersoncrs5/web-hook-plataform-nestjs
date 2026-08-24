import { roles } from "src/infra/database/schema/roles.schema";

export type Role = typeof roles.$inferSelect;

export type NewRole = typeof roles.$inferInsert;