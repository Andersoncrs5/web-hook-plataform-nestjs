import {
 pgTable,
 uuid,
 varchar,
 boolean,
 timestamp,
 integer
} from "drizzle-orm/pg-core";


export const users = pgTable("users", {

 id: uuid("id")
    .defaultRandom()
    .primaryKey(),

 name: varchar("name", {
    length:100
 }).notNull().unique("uk_name_user"),

 fullName: varchar("full_name", {
    length:100
 }),

 email: varchar("email", {
    length:255
 })
 .notNull()
 .unique("uk_email_users"),

 passwordHash:
 varchar("password_hash")
 .notNull(),

 emailVerified:
 boolean("email_verified")
 .default(false)
 .notNull(),

 status:
 varchar("status")
 .notNull(),

 lastLoginAt:
 timestamp("last_login_at"),

 version: integer("version")
 .default(0)
 .notNull(),

 createdAt:
 timestamp("created_at")
 .defaultNow()
 .notNull(),

 updatedAt:
 timestamp("updated_at")
 .defaultNow()
 .notNull(),

 deletedAt:
 timestamp("deleted_at"),

});