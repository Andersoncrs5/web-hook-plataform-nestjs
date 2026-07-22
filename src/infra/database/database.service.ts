import { Injectable } from '@nestjs/common';
import { db } from './drizzle';

@Injectable()
export class DatabaseService {
  get connection() {
    return db;
  }
}