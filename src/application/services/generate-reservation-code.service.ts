import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';

@Injectable()
export class GenerateReservationCodeService {
  private readonly ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  generate(options?: {
    length?: number;
    prefix?: string;
    withChecksum?: boolean;
  }): string {
    const length = Math.max(6, Math.min(24, options?.length ?? 8));
    const prefix = (options?.prefix ?? '')
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '')
      .slice(0, 8);
    const buf = randomBytes(length);

    let code = '';
    for (let i = 0; i < length; i++)
      code += this.ALPHABET[buf[i] % this.ALPHABET.length];

    if (options?.withChecksum) {
      const h = createHash('sha256')
        .update(prefix + code)
        .digest();
      code += String(h[0] % 10);
    }
    return prefix ? `${prefix}-${code}` : code;
  }
}
