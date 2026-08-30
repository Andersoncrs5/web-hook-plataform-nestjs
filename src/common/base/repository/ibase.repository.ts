import { SQL } from 'drizzle-orm';

export abstract class IBaseRepository<TEntity> {
  abstract create(entity: TEntity): Promise<TEntity>;
  abstract update(entity: TEntity): Promise<TEntity>;
  abstract findById(id: string): Promise<TEntity | null>;
  abstract existsById(id: string): Promise<boolean>;
  abstract deleteById(id: string): Promise<boolean>;
  abstract deleteByIdAndCount(id: string): Promise<number>;

  abstract countAll(): Promise<number>;
  abstract deleteAll(): Promise<number>;

  abstract softDeleteById(id: string): Promise<boolean>;
  abstract restoreById(id: string): Promise<boolean>;
  abstract createMany(entities: TEntity[]): Promise<TEntity[]>;

  abstract updateWithVersion(entity: TEntity): Promise<TEntity | null>;
  abstract findOneBy(condition: SQL): Promise<TEntity | null>;
  abstract existsBy(condition: SQL): Promise<boolean>;
}
