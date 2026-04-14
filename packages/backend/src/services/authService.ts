import crypto from 'crypto';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

const base64UrlEncode = (value: string): string =>
  Buffer.from(value).toString('base64url');

const base64UrlDecode = (value: string): string =>
  Buffer.from(value, 'base64url').toString();

export class AuthService {
  /**
   * Generate JWT-like token (simplified implementation)
   * In production, use jsonwebtoken library
   */
  static generateToken(payload: TokenPayload): string {
    const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

    const payloadStr = base64UrlEncode(JSON.stringify(payload));

    // Create signature
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payloadStr}`)
      .digest('base64url');

    return `${header}.${payloadStr}.${signature}`;
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): TokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const [header, payload, signature] = parts;
      const secret = process.env.JWT_SECRET || 'your-secret-key';

      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        return null;
      }

      // Decode payload
      const decoded = JSON.parse(base64UrlDecode(payload));
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Hash password (use bcrypt in production)
   */
  static hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Verify password
   */
  static verifyPassword(
    plainPassword: string,
    hashedPassword: string
  ): boolean {
    return this.hashPassword(plainPassword) === hashedPassword;
  }
}
