export class BaseFilter {
    id?: string
    version?: number

    createdAtMin?: Date
    createdAtMax?: Date

    updatedAtMin?: Date
    updatedAtMax?: Date
}