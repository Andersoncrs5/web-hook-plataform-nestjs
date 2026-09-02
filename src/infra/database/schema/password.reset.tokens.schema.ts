import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  index,
  uniqueIndex,
  foreignKey,
} from 'drizzle-orm/pg-core';

import { idPattern, createdAtPattern, updatedAtPattern } from '../schema-helpers';

import { users } from './user.schema';

export const passwordResetTokens = pgTable(
  'password_reset_tokens',
  {
    ...idPattern,

    userId: uuid('user_id').notNull(),

    tokenHash: varchar('token_hash', { length: 128 }).notNull(),

    expiresAt: timestamp('expires_at').notNull(),

    usedAt: timestamp('used_at'),

    enabled: boolean('enabled').default(true).notNull(),

    ...createdAtPattern,
    ...updatedAtPattern,
  },
  (table) => [
    foreignKey({
      name: 'fk_password_reset_tokens_user',
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete('cascade'),

    uniqueIndex('uk_password_reset_tokens_token_hash').on(table.tokenHash),

    index('idx_password_reset_tokens_user_id').on(table.userId),

    index('idx_password_reset_tokens_expires_at').on(table.expiresAt),

    index('idx_password_reset_tokens_user_id_enabled').on(table.userId, table.enabled),
  ],
);
