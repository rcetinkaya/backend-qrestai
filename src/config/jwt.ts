/**
 * JWT Configuration
 */

import { env } from './env.js';

export const jwtConfig = {
  accessToken: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  refreshToken: {
    secret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
};

export type JwtPayload = {
  userId: string;
  email: string;
  orgId?: string;
  role?: string;
  type: 'access' | 'refresh';
};
