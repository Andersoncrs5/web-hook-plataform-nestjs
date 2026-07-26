import { uuid, timestamp, integer, PgTableWithColumns } from "drizzle-orm/pg-core";

export abstract class BaseSchema {
  abstract readonly table: PgTableWithColumns<any>;
}

export const idPattern = {
  id: uuid("id").defaultRandom().primaryKey(),
};

export const createdAtPattern = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
};

export const updatedAtPattern = {
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
};

export const versionPattern = {
  version: integer("version").default(0).notNull(),
};

export const deletedAtPattern = {
  deletedAt: timestamp("deleted_at"),
};