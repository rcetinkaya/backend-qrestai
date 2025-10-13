/**
 * Authentication related types
 */

import { Role } from '@prisma/client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
  organization?: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  organizationName: string;
  organizationSlug: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  orgId?: string;
  role?: Role;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}
