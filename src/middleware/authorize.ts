/**
 * Authorization middleware
 * Checks user role permissions
 */

import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthorizationError, AuthenticationError } from '../types/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY: Role[] = [Role.VIEWER, Role.EDITOR, Role.ADMIN, Role.OWNER];

export const authorize = (...allowedRoles: Role[]) => {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const userRole = req.user.role;

    if (!userRole) {
      throw new AuthorizationError('User role not found');
    }

    // Check if user role is in allowed roles
    if (!allowedRoles.includes(userRole)) {
      throw new AuthorizationError(`Required role: ${allowedRoles.join(' or ')}`);
    }

    next();
  });
};

/**
 * Check if user has minimum role level
 */
export const requireRole = (minRole: Role) => {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const userRole = req.user.role;

    if (!userRole) {
      throw new AuthorizationError('User role not found');
    }

    const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole);
    const minRoleIndex = ROLE_HIERARCHY.indexOf(minRole);

    if (userRoleIndex < minRoleIndex) {
      throw new AuthorizationError(`Minimum required role: ${minRole}`);
    }

    next();
  });
};

/**
 * Check if user is owner of the organization
 */
export const requireOwner = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }

  if (req.user.role !== Role.OWNER) {
    throw new AuthorizationError('Only organization owner can perform this action');
  }

  next();
});

/**
 * Check if user is admin (for admin panel)
 */
export const requireAdmin = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }

  // Check if user has admin/owner privileges or is part of admin organization
  const userRole = req.user.role;

  if (userRole !== Role.OWNER && userRole !== Role.ADMIN) {
    throw new AuthorizationError('Admin access required');
  }

  next();
});
