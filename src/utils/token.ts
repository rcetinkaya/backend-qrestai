/**
 * JWT token utilities
 */

import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';
import { JwtPayload } from '../types/auth.js';

export class TokenUtils {
  /**
   * Generate access token
   */
  static generateAccessToken(payload: Omit<JwtPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'access' },
      jwtConfig.accessToken.secret,
      { expiresIn: jwtConfig.accessToken.expiresIn as jwt.SignOptions['expiresIn'] }
    );
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
    return jwt.sign(
      { ...payload, type: 'refresh' },
      jwtConfig.refreshToken.secret,
      { expiresIn: jwtConfig.refreshToken.expiresIn as jwt.SignOptions['expiresIn'] }
    );
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, jwtConfig.accessToken.secret) as JwtPayload;
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, jwtConfig.refreshToken.secret) as JwtPayload;
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decode(token: string): JwtPayload | null {
    return jwt.decode(token) as JwtPayload | null;
  }
}
