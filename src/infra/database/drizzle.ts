import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

export function createDatabase(databaseUrl: string) {
  const client = postgres(databaseUrl, {
    max: 20
  });

  return {
    client,
    db: drizzle(client),
  };
}

/*
import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export interface CreateDatabaseOptions<TSchema extends Record<string, unknown>> {
  databaseUrl: string;
  schema?: TSchema;
  max?: number;
  idleTimeout?: number;
  connectTimeout?: number;
  ssl?: boolean | 'require' | 'allow' | 'prefer';
  enableLogger?: boolean;
}

export function createDatabase<TSchema extends Record<string, unknown> = Record<string, unknown>>({
  databaseUrl,
  schema,
  max = 20,
  idleTimeout = 20,
  connectTimeout = 10,
  ssl = process.env.NODE_ENV === 'production' ? 'require' : false,
  enableLogger = process.env.NODE_ENV === 'development',
}: CreateDatabaseOptions<TSchema>) {
  if (!databaseUrl) {
    throw new Error('Database URL was not provided to createDatabase.');
  }

  const client = postgres(databaseUrl, {
    max,
    idle_timeout: idleTimeout,
    connect_timeout: connectTimeout,
    ssl,
  });

  const db = drizzle(client, {
    schema,
    logger: enableLogger,
  });

  return {
    client,
    db,
    close: async () => {
      await client.end();
    },
  };
}

*/