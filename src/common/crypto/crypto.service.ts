import { Injectable } from '@nestjs/common';
import {
  randomBytes,
  randomUUID,
  createHash,
  createHmac,
  timingSafeEqual,
} from 'node:crypto';

@Injectable()
export class CryptoService {
  generateUuid(): string {
    return randomUUID();
  }

  randomHex(size = 32): string {
    return randomBytes(size).toString('hex');
  }

  randomBase64Url(size = 32): string {
    return randomBytes(size).toString('base64url');
  }

  sha256(value: string): string {
    return createHash('sha256')
      .update(value)
      .digest('hex');
  }

  sha512(value: string): string {
    return createHash('sha512')
      .update(value)
      .digest('hex');
  }

  hmacSha256(secret: string, payload: string): string {
    return createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  secureCompare(left: string, right: string): boolean {
    const a = Buffer.from(left);
    const b = Buffer.from(right);

    if (a.length !== b.length) {
      return false;
    }

    return timingSafeEqual(a, b);
  }

  generateWebhookSecret(): string {
    return `whsec_${this.randomBase64Url(32)}`;
  }

  generateApiKey(): string {
    return `whpk_${this.randomBase64Url(32)}`;
  }

  generateRefreshToken(): string {
    return this.randomBase64Url(64);
  }
}