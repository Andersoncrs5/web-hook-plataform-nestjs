import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const client = postgres(process.env.DATABASE_URL!, {
  max: 20,
});

export const db = drizzle(client);