export class UniqueConstraintViolationException extends Error {
  constructor(
    public readonly field: string,
    public readonly value: any,
    message?: string,
  ) {
    super(message || `The ${field} already exists in the database.`);
    this.name = 'UniqueConstraintViolationException';
  }
}
