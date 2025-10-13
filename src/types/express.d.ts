/**
 * Express type extensions
 * Adds custom properties to Express Request
 */

import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        orgId?: string;
        role?: Role;
      };
    }
  }
}

export {};
