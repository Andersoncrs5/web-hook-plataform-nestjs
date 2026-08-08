import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infra/database/schema/*.schema.ts',
  out: './src/infra/database/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});