/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */

import { Request, Response, NextFunction } from 'express';
import { TokenUtils } from '../utils/token.js';
import { AuthenticationError } from '../types/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  // Get token from header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('No token provided');
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    // Verify token
    const payload = TokenUtils.verifyAccessToken(token);

    // Check token type
    if (payload.type !== 'access') {
      throw new AuthenticationError('Invalid token type');
    }

    // Attach user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      orgId: payload.orgId,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      throw new AuthenticationError(`Invalid token: ${error.message}`);
    }
    throw new AuthenticationError('Invalid token');
  }
});

/**
 * Optional authentication - doesn't throw if no token
 */
export const optionalAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const payload = TokenUtils.verifyAccessToken(token);

      if (payload.type === 'access') {
        req.user = {
          userId: payload.userId,
          email: payload.email,
          orgId: payload.orgId,
          role: payload.role,
        };
      }
    } catch {
      // Ignore errors in optional auth
    }
  }

  next();
});
