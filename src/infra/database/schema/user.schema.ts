import { pgTable, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { BaseSchema, idPattern, createdAtPattern, updatedAtPattern, versionPattern, deletedAtPattern } from "../schema-helpers";

export const users = pgTable("users", {
  ...idPattern, 

  name: varchar("name", { length: 100 }).notNull().unique("uk_name_user"),
  fullName: varchar("full_name", { length: 100 }),
  email: varchar("email", { length: 255 }).notNull().unique("uk_email_user"),
  passwordHash: varchar("password_hash").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  status: varchar("status").notNull(),
  lastLoginAt: timestamp("last_login_at"),

  ...versionPattern,
  ...createdAtPattern,
  ...updatedAtPattern,
  ...deletedAtPattern,
});

export type NewUser = typeof users.$inferInsert;

export class UsersSchema extends BaseSchema {
  readonly table = users;
}