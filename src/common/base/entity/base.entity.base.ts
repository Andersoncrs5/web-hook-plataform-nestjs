export class BaseEntity {
    id: string
    version: number = 0
    createdAt: Date = new Date
    updatedAt: Date = new Date
    deletedAt: Date | null = null
}