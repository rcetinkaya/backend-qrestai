/**
 * Auth Service
 * Business logic for authentication
 */

import { prisma } from '../config/database.js';
import { PasswordUtils } from '../utils/password.js';
import { TokenUtils } from '../utils/token.js';
import { AuthenticationError, ConflictError, NotFoundError } from '../types/errors.js';
import { AuthResponse, LoginCredentials, RegisterData } from '../types/auth.js';
import { Plan, Role } from '@prisma/client';

export class AuthService {
  /**
   * Register new user and organization
   */
  static async register(data: RegisterData): Promise<AuthResponse> {
    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Check if organization slug exists
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: data.organizationSlug },
    });

    if (existingOrg) {
      throw new ConflictError('Organization slug already taken');
    }

    // Hash password
    const hashedPassword = await PasswordUtils.hash(data.password);

    // Create user and organization in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const org = await tx.organization.create({
        data: {
          name: data.organizationName,
          slug: data.organizationSlug,
          plan: Plan.FREE,
          aiCredits: 50, // Initial free credits
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          emailVerified: false,
        },
      });

      // Link user to organization as OWNER
      await tx.userOrganization.create({
        data: {
          userId: user.id,
          orgId: org.id,
          role: Role.OWNER,
        },
      });

      return { user, org };
    });

    // Generate tokens
    const accessToken = TokenUtils.generateAccessToken({
      userId: result.user.id,
      email: result.user.email,
      orgId: result.org.id,
      role: Role.OWNER,
    });

    const refreshToken = TokenUtils.generateRefreshToken({
      userId: result.user.id,
      email: result.user.email,
    });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: result.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: Role.OWNER,
        organizationId: result.org.id,
      },
      accessToken,
      refreshToken,
      organization: {
        id: result.org.id,
        name: result.org.name,
        slug: result.org.slug,
        plan: result.org.plan,
      },
    };
  }

  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
      include: {
        organizations: {
          include: {
            organization: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Verify password
    const isValid = await PasswordUtils.compare(credentials.password, user.password);

    if (!isValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const userOrg = user.organizations[0];

    // Generate tokens
    const accessToken = TokenUtils.generateAccessToken({
      userId: user.id,
      email: user.email,
      orgId: userOrg?.orgId,
      role: userOrg?.role,
    });

    const refreshToken = TokenUtils.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: userOrg?.role,
        organizationId: userOrg?.orgId,
      },
      accessToken,
      refreshToken,
      organization: userOrg ? {
        id: userOrg.organization.id,
        name: userOrg.organization.name,
        slug: userOrg.organization.slug,
        plan: userOrg.organization.plan,
      } : undefined,
    };
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(token: string): Promise<{ accessToken: string }> {
    // Verify refresh token
    const payload = TokenUtils.verifyRefreshToken(token);

    // Check if token exists and not revoked
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            organizations: {
              take: 1,
            },
          },
        },
      },
    });

    if (!storedToken || storedToken.revoked) {
      throw new AuthenticationError('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new AuthenticationError('Refresh token expired');
    }

    const userOrg = storedToken.user.organizations[0];

    // Generate new access token
    const accessToken = TokenUtils.generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      orgId: userOrg?.orgId,
      role: userOrg?.role,
    });

    return { accessToken };
  }

  /**
   * Logout (revoke refresh token)
   */
  static async logout(token: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: { revoked: true },
    });
  }

  /**
   * Get current user
   */
  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        organizations: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }
}
