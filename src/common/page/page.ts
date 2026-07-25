export enum SortDirection {
    ASC = "asc",
    DESC = "desc",
}

export class Pageable<T> {
    page = 1;
    size = 30;

    sortBy: T;
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
    
}

