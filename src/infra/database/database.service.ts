import { Injectable } from '@nestjs/common';
import { createDatabase } from './drizzle';

@Injectable()
export class DatabaseService {
  private readonly client;
  private readonly database;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }

    const { client, db } = createDatabase(databaseUrl);

    this.client = client;
    this.database = db;
  }

  get connection() {
    return this.database;
  }
}