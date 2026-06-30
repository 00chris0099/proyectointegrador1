import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../../config/environment';

interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  type: 'access' | 'refresh';
}

export class TokenService {
  generateAccessToken(userId: string, email: string, roles: string[]): string {
    const payload: TokenPayload = {
      sub: userId,
      email,
      roles,
      type: 'access'
    };

    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: '12h',
      issuer: 'minierp',
      jwtid: uuidv4()
    });
  }

  generateRefreshToken(userId: string): string {
    const payload = {
      sub: userId,
      type: 'refresh'
    };

    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: '7d',
      issuer: 'minierp',
      jwtid: uuidv4()
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, config.JWT_SECRET, {
      issuer: 'minierp'
    }) as TokenPayload;
  }

  verifyRefreshToken(token: string): { sub: string; jti: string } {
    return jwt.verify(token, config.JWT_SECRET, {
      issuer: 'minierp'
    }) as { sub: string; jti: string };
  }

  decodeToken(token: string): any {
    return jwt.decode(token);
  }

  getRefreshTokenExpiration(): Date {
    const now = new Date();
    now.setDate(now.getDate() + 7);
    return now;
  }
}

export const tokenService = new TokenService();
