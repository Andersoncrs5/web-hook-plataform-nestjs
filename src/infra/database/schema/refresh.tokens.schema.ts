import {
  pgTable,
  uuid,
  timestamp,
  text,
  index,
  uniqueIndex,
  varchar,
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
import { RefreshTokenStatus } from "src/common/enums/refresh-token/refresh-token-status.enum";

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    ...idPattern,

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    tokenHash: text("token_hash").notNull(),

    status: varchar("status", { length: 20 })
      .$type<RefreshTokenStatus>()
      .notNull()
      .default(RefreshTokenStatus.ACTIVE),

    expiresAt: timestamp("expires_at").notNull(),

    revokedAt: timestamp("revoked_at"),

    replacedByTokenId: uuid("replaced_by_token_id"),

    ...versionPattern,
    ...createdAtPattern,
    ...updatedAtPattern,
    ...deletedAtPattern,
  },
  (table) => [
    uniqueIndex("uk_refresh_tokens_token_hash").on(table.tokenHash),

    index("idx_refresh_tokens_user").on(table.userId),

    index("idx_refresh_tokens_status").on(table.status),

    index("idx_refresh_tokens_expires_at").on(table.expiresAt),

    index("idx_refresh_tokens_revoked_at").on(table.revokedAt),

    index("idx_refresh_tokens_user_status").on(
      table.userId,
      table.status,
    ),

    index("idx_refresh_tokens_user_expires").on(
      table.userId,
      table.expiresAt,
    ),
  ],
);

export class RefreshTokenSchema extends BaseSchema {
  readonly table = refreshTokens;
}