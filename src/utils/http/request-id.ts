import { FastifyRequest } from 'fastify';
import { v4 as uuid } from 'uuid';

export function getRequestId(request: FastifyRequest): string {
  const header = request.headers['x-idempotency-key'];

  if (typeof header === 'string' && header.length > 0) {
    return header;
  }

  return request.id ?? uuid();
}
