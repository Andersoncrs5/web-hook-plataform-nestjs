import 'dotenv/config';

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

async function main() {
  const client = postgres(process.env.DATABASE_URL!);

  const db = drizzle(client);

  await migrate(db, {
    migrationsFolder: './drizzle',
  });

  await client.end();

  console.log('✅ Migrations executadas com sucesso.');
}

main().catch(console.error);