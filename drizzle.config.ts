import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infra/database/schema/*',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});