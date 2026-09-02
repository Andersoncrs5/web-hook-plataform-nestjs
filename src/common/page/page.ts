import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export class Pageable<T> {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size = 30;

  sortBy: T;

  @IsOptional()
  @IsEnum(SortDirection)
  direction = SortDirection.DESC;
}

export class Page<T> {
  constructor(
    readonly content: T[],
    readonly page: number,
    readonly size: number,
    readonly totalElements: number,
  ) {}

  get totalPages(): number {
    return Math.ceil(this.totalElements / this.size);
  }

  map<U>(mapper: (item: T) => U): Page<U> {
    return new Page(this.content.map(mapper), this.page, this.size, this.totalElements);
  }
}

export function normalizePageable<T>(pageable: Pageable<T>, defaultSort: T): Required<Pageable<T>> {
  return {
    page: pageable.page ?? 1,
    size: pageable.size ?? 30,
    sortBy: pageable.sortBy ?? defaultSort,
    direction: pageable.direction ?? SortDirection.DESC,
  };
}
