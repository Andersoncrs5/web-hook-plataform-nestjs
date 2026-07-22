import { HttpException, HttpStatus } from '@nestjs/common';

export class ResponseException extends HttpException {
  constructor(message: string, status: HttpStatus) {
    super(
      {
        success: false,
        message,
        error: 'ResponseRuleViolation',
      },
      status,
    );
  }
}
