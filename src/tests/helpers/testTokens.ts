/**
 * Test Token Helpers
 */

import { TokenUtils } from '../../utils/token.js';
import { Role } from '@prisma/client';

export class TestTokens {
  /**
   * Generate test access token
   */
  static generateAccessToken(data: {
    userId: string;
    email: string;
    orgId?: string;
    role?: Role;
  }) {
    return TokenUtils.generateAccessToken(data);
  }

  /**
   * Generate test refresh token
   */
  static generateRefreshToken(data: {
    userId: string;
    email: string;
  }) {
    return TokenUtils.generateRefreshToken(data);
  }

  /**
   * Generate both tokens
   */
  static generateTokenPair(data: {
    userId: string;
    email: string;
    orgId?: string;
    role?: Role;
  }) {
    return {
      accessToken: this.generateAccessToken(data),
      refreshToken: this.generateRefreshToken({
        userId: data.userId,
        email: data.email,
      }),
    };
  }
}
