import { FastifyRequest } from 'fastify';
import { randomUUID } from 'node:crypto';

export function getRequestId(request: FastifyRequest): string {
  const header = request.headers['x-idempotency-key'];

  if (typeof header === 'string' && header.length > 0) {
    return header;
  }

  return request.id ?? randomUUID();
}
