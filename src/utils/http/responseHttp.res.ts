import { ApiProperty } from '@nestjs/swagger';

export class ResponseHTTP<T> {
  @ApiProperty({ description: 'The main content of the answer' })
  body: T;

  @ApiProperty({ example: '2026-03-04T14:45:00Z' })
  timestamp: string;

  @ApiProperty({ example: '/v1/auth/login' })
  path: string;

  @ApiProperty({ example: 'POST' })
  method: string;

  @ApiProperty({ example: 'Operation carried out successfully' })
  message: string;

  @ApiProperty({ example: 'uuid-of-request' })
  traceId: string;

  status: boolean;
}
