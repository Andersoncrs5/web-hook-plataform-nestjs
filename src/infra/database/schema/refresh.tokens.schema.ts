import {
  pgTable,
  uuid,
  timestamp,
  text,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const refreshTokens = pgTable("refresh_tokens", {

  id: uuid("id")
    .defaultRandom()
    .primaryKey(),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  tokenHash: text("token_hash")
    .notNull(),

  expiresAt: timestamp("expires_at")
    .notNull(),

  revokedAt: timestamp("revoked_at"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),

}, (table) => [
  uniqueIndex("uk_refresh_tokens_token_hash").on(table.tokenHash),

  index("idx_refresh_tokens_user_status").on(table.userId, table.expiresAt, table.revokedAt),
]);
