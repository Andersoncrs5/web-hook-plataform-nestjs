import { SQL, and, eq, isNull } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { DatabaseService } from 'src/infra/database/database.service';
import { eqIgnoreCase } from 'src/common/repository/custom.query';
import { BaseEntity } from '../entity/base.entity.base';
import { count } from 'console';

export abstract class BaseRepository<
  TEntity extends BaseEntity,
  TTable extends PgTable & {
    id: any;
    deletedAt?: any;
    createdAt?: any;
    updatedAt?: any;
    version?: any;
  },
> {
  constructor(
    protected readonly database: DatabaseService,
    protected readonly table: TTable,
    protected readonly toDomain: (raw: any) => TEntity,
    protected readonly toPersistence: (entity: TEntity) => any,
  ) {}

  protected applySoftDeleteCondition(conditions: any[] = []): any[] {
    if ('deletedAt' in this.table && this.table.deletedAt) {
      conditions.push(isNull(this.table.deletedAt));
    }
    return conditions;
  }

  async findById(id: string): Promise<TEntity | null> {
    const conditions = this.applySoftDeleteCondition([eq(this.table.id, id)]);

    const [raw] = await this.database.connection
      .select()
      .from(this.table)
      .where(and(...conditions))
      .limit(1);

    return raw ? this.toDomain(raw) : null;
  }

  async existsById(id: string): Promise<boolean> {
    const conditions = this.applySoftDeleteCondition([eq(this.table.id, id)]);

    const [existing] = await this.database.connection
      .select({ id: this.table.id })
      .from(this.table)
      .where(and(...conditions))
      .limit(1);

    return existing !== undefined;
  }

  async create(entity: TEntity): Promise<TEntity> {
    const [created] = await this.database.connection
      .insert(this.table)
      .values(this.toPersistence(entity))
      .returning();

    return this.toDomain(created);
  }

  async update(entity: TEntity): Promise<TEntity> {
    const updateData: Record<string, any> = {
      ...this.toPersistence(entity),
    };

    if ('version' in this.table && entity.version !== undefined) {
      updateData.version = entity.version + 1;
    }

    if ('updatedAt' in this.table) {
      updateData.updatedAt = new Date();
    }

    const [updated] = await this.database.connection
      .update(this.table)
      .set(updateData)
      .where(eq(this.table.id, entity.id))
      .returning();

    return this.toDomain(updated);
  }

  async deleteById(id: string): Promise<boolean> {
    const deleted = await this.database.connection
      .delete(this.table)
      .where(eq(this.table.id, id))
      .returning({ id: this.table.id });

    return deleted.length > 0;
  }

  async deleteByIdAndCount(id: string): Promise<number> {
    const deleted = await this.database.connection
      .delete(this.table)
      .where(eq(this.table.id, id))
      .returning({ id: this.table.id });

    return deleted.length;
  }

  async countAll(): Promise<number> {
    const conditions = this.applySoftDeleteCondition();

    const [result] = await this.database.connection
      .select({ value: count() })
      .from(this.table)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return Number(result?.value ?? 0);
  }

  async deleteAll(): Promise<number> {
    const deleted = await this.database.connection
      .delete(this.table)
      .returning({ id: this.table.id });

    return deleted.length;
  }

  async softDeleteById(id: string): Promise<boolean> {
    if (!('deletedAt' in this.table)) {
      return this.deleteById(id);
    }

    const [updated] = await this.database.connection
      .update(this.table)
      .set({ deletedAt: new Date() } as any)
      .where(and(eq(this.table.id, id), isNull(this.table.deletedAt)))
      .returning({ id: this.table.id });

    return updated !== undefined;
  }

  async restoreById(id: string): Promise<boolean> {
    if (!('deletedAt' in this.table)) return false;

    const [restored] = await this.database.connection
      .update(this.table)
      .set({ deletedAt: null } as any)
      .where(eq(this.table.id, id))
      .returning({ id: this.table.id });

    return restored !== undefined;
  }

  async createMany(entities: TEntity[]): Promise<TEntity[]> {
    if (!entities.length) return [];

    const persistenceValues = entities.map(this.toPersistence);

    const created = await this.database.connection
      .insert(this.table)
      .values(persistenceValues)
      .returning();

    return created.map(this.toDomain);
  }

  async updateWithVersion(entity: TEntity): Promise<TEntity | null> {
    const updateData: Record<string, any> = { ...this.toPersistence(entity) };
    const currentVersion = entity.version ?? 0;

    if ('version' in this.table) {
      updateData.version = currentVersion + 1;
    }

    if ('updatedAt' in this.table) {
      updateData.updatedAt = new Date();
    }

    const conditions = [eq(this.table.id, entity.id), eq(this.table.version, currentVersion)];
    this.applySoftDeleteCondition(conditions);

    const [updated] = await this.database.connection
      .update(this.table)
      .set(updateData)
      .where(and(...conditions))
      .returning();

    return updated ? this.toDomain(updated) : null;
  }

  async findOneBy(condition: SQL): Promise<TEntity | null> {
    const conditions = this.applySoftDeleteCondition([condition]);

    const [raw] = await this.database.connection
      .select()
      .from(this.table)
      .where(and(...conditions))
      .limit(1);

    return raw ? this.toDomain(raw) : null;
  }

  async existsBy(condition: SQL): Promise<boolean> {
    const conditions = this.applySoftDeleteCondition([condition]);

    const [existing] = await this.database.connection
      .select({ id: this.table.id })
      .from(this.table)
      .where(and(...conditions))
      .limit(1);

    return existing !== undefined;
  }
}
