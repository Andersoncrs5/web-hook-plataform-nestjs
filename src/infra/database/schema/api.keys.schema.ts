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
import {
  idPattern,
  createdAtPattern,
  updatedAtPattern,
  deletedAtPattern,
  versionPattern,
} from '../schema-helpers';
import { applications } from './applications.schema';
import { jsonb } from 'drizzle-orm/pg-core';
import { users } from './user.schema';
import { pgEnum } from 'drizzle-orm/pg-core';

export const apiKeyEnvironmentEnum = pgEnum('api_key_environment', ['live', 'test', 'dev']);

export const apiKeys = pgTable(
  'api_keys',
  {
    ...idPattern,

    applicationId: uuid('application_id').notNull(),

    createdBy: uuid('created_by'),

    name: varchar('name').notNull(),

    keyHash: varchar('key_hash').notNull(),

    keyPrefix: varchar('key_prefix', {
      length: 20,
    }).notNull(),

    keyLastChars: varchar('key_last_chars', {
      length: 4,
    }).notNull(),

    metadata: jsonb('metadata'),

    environment: apiKeyEnvironmentEnum('environment').default('live').notNull(),

    lastUsedAt: timestamp('last_used_at'),

    expiresAt: timestamp('expires_at'),

    enabled: boolean('enabled').default(true).notNull(),

    ...versionPattern,
    ...createdAtPattern,
    ...updatedAtPattern,
    ...deletedAtPattern,
  },

  (table) => [
    foreignKey({
      name: 'fk_api_keys_created_by',
      columns: [table.createdBy],
      foreignColumns: [users.id],
    }).onDelete('set null'),

    foreignKey({
      name: 'fk_api_keys_application',
      columns: [table.applicationId],
      foreignColumns: [applications.id],
    }).onDelete('cascade'),

    index('idx_api_keys_application_id').on(table.applicationId),

    index('idx_api_keys_key_prefix').on(table.keyPrefix),

    uniqueIndex('uk_api_keys_application_name').on(table.applicationId, table.name),

    uniqueIndex('uk_api_keys_key_hash').on(table.keyHash),
  ],
);
