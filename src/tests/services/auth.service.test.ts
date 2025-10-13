/**
 * Auth Service Tests
 */

import { AuthService } from '../../services/auth.service.js';
import { TestDb } from '../helpers/testDb.js';
import { TestTokens } from '../helpers/testTokens.js';
import { ConflictError, AuthenticationError } from '../../types/errors.js';
import { prisma } from '../../config/database.js';

describe('AuthService', () => {
  beforeEach(async () => {
    await TestDb.cleanup();
  });

  describe('register', () => {
    it('should register new user and organization', async () => {
      const result = await AuthService.register({
        email: 'newuser@test.com',
        password: 'Password123!',
        name: 'New User',
        organizationName: 'New Org',
        organizationSlug: 'new-org',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('organization');
      expect(result.user.email).toBe('newuser@test.com');
      expect(result.organization?.slug).toBe('new-org');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });

    it('should throw error if email already exists', async () => {
      await TestDb.createUser({ email: 'existing@test.com' });

      await expect(
        AuthService.register({
          email: 'existing@test.com',
          password: 'Password123!',
          name: 'User',
          organizationName: 'Org',
          organizationSlug: 'org',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw error if organization slug already exists', async () => {
      await TestDb.createOrganization({ slug: 'existing-org' });

      await expect(
        AuthService.register({
          email: 'newuser@test.com',
          password: 'Password123!',
          name: 'User',
          organizationName: 'Org',
          organizationSlug: 'existing-org',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const org = await TestDb.createOrganization();
      const user = await TestDb.createUser({
        email: 'user@test.com',
        password: 'password123',
      });
      await TestDb.linkUserToOrg(user.id, org.id);

      const result = await AuthService.login({
        email: 'user@test.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe('user@test.com');
      expect(result.tokens.accessToken).toBeTruthy();
    });

    it('should throw error with invalid email', async () => {
      await expect(
        AuthService.login({
          email: 'nonexistent@test.com',
          password: 'password123',
        })
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw error with invalid password', async () => {
      await TestDb.createUser({
        email: 'user@test.com',
        password: 'correctpassword',
      });

      await expect(
        AuthService.login({
          email: 'user@test.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      const { user } = await TestDb.createTestSetup();

      // Create real JWT refresh token
      const refreshToken = TestTokens.generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const result = await AuthService.refreshAccessToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
    });

    it('should throw error with revoked refresh token', async () => {
      const { user } = await TestDb.createTestSetup();

      // Create real JWT refresh token
      const refreshToken = TestTokens.generateRefreshToken({
        userId: user.id,
        email: user.email,
      });

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          revoked: true,
        },
      });

      await expect(
        AuthService.refreshAccessToken(refreshToken)
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('logout', () => {
    it('should revoke refresh token on logout', async () => {
      const { user } = await TestDb.createTestSetup();

      const refreshToken = 'test-token';
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await AuthService.logout(refreshToken);

      const token = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      expect(token?.revoked).toBe(true);
    });
  });
});
