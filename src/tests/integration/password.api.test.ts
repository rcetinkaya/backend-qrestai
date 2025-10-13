/**
 * Password Reset API Integration Tests
 */

import request from 'supertest';
import app from '../../index.js';
import { TestDb } from '../helpers/testDb.js';

describe('Password Reset API', () => {
  let testData: any;

  beforeAll(async () => {
    testData = await TestDb.createTestSetup();
  });

  afterAll(async () => {
    await TestDb.cleanup();
  });

  describe('POST /api/password/forgot-password', () => {
    it('should send password reset email', async () => {
      const response = await request(app)
        .post('/api/password/forgot-password')
        .send({ email: testData.user.email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link');
      expect(response.body.data.resetLink).toBeDefined();
    });

    it('should return success even for non-existent email (security)', async () => {
      const response = await request(app)
        .post('/api/password/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('If that email exists');
    });

    it('should fail without email', async () => {
      await request(app)
        .post('/api/password/forgot-password')
        .send({})
        .expect(400);
    });

    it('should delete old reset tokens', async () => {
      const { prisma } = await import('../../config/database.js');

      // Create old token
      await prisma.passwordResetToken.create({
        data: {
          userId: testData.user.id,
          token: 'old-reset-token',
          expires: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      await request(app)
        .post('/api/password/forgot-password')
        .send({ email: testData.user.email })
        .expect(200);

      // Verify old token is deleted
      const oldToken = await prisma.passwordResetToken.findUnique({
        where: { token: 'old-reset-token' },
      });
      expect(oldToken).toBeNull();
    });
  });

  describe('POST /api/password/verify-reset-token', () => {
    it('should verify valid reset token', async () => {
      const { prisma } = await import('../../config/database.js');

      // Create reset token
      const resetToken = await prisma.passwordResetToken.create({
        data: {
          userId: testData.user.id,
          token: 'valid-reset-token',
          expires: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const response = await request(app)
        .post('/api/password/verify-reset-token')
        .send({ token: resetToken.token })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testData.user.email);

      // Cleanup
      await prisma.passwordResetToken.delete({
        where: { token: resetToken.token },
      });
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/password/verify-reset-token')
        .send({ token: 'invalid-token' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail with expired token', async () => {
      const { prisma } = await import('../../config/database.js');

      // Create expired token
      const expiredToken = await prisma.passwordResetToken.create({
        data: {
          userId: testData.user.id,
          token: 'expired-reset-token',
          expires: new Date(Date.now() - 1000), // Already expired
        },
      });

      const response = await request(app)
        .post('/api/password/verify-reset-token')
        .send({ token: expiredToken.token })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });
  });

  describe('POST /api/password/reset-password', () => {
    it('should reset password with valid token', async () => {
      const { prisma } = await import('../../config/database.js');

      // Create reset token
      const resetToken = await prisma.passwordResetToken.create({
        data: {
          userId: testData.user.id,
          token: 'reset-token-123',
          expires: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const response = await request(app)
        .post('/api/password/reset-password')
        .send({
          token: resetToken.token,
          newPassword: 'newSecurePassword123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset successfully');

      // Verify token is deleted
      const deletedToken = await prisma.passwordResetToken.findUnique({
        where: { token: resetToken.token },
      });
      expect(deletedToken).toBeNull();

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testData.user.email,
          password: 'newSecurePassword123',
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/password/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'newPassword123',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail with expired token', async () => {
      const { prisma } = await import('../../config/database.js');

      const expiredToken = await prisma.passwordResetToken.create({
        data: {
          userId: testData.user.id,
          token: 'expired-token-123',
          expires: new Date(Date.now() - 1000),
        },
      });

      const response = await request(app)
        .post('/api/password/reset-password')
        .send({
          token: expiredToken.token,
          newPassword: 'newPassword123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });

    it('should fail with short password', async () => {
      const { prisma } = await import('../../config/database.js');

      const resetToken = await prisma.passwordResetToken.create({
        data: {
          userId: testData.user.id,
          token: 'token-short-pass',
          expires: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const response = await request(app)
        .post('/api/password/reset-password')
        .send({
          token: resetToken.token,
          newPassword: '12345', // Too short
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('at least 6 characters');

      // Cleanup
      await prisma.passwordResetToken.delete({
        where: { token: resetToken.token },
      });
    });

    it('should fail without required fields', async () => {
      await request(app)
        .post('/api/password/reset-password')
        .send({ token: 'some-token' })
        .expect(400);

      await request(app)
        .post('/api/password/reset-password')
        .send({ newPassword: 'password123' })
        .expect(400);
    });

    it('should delete all user sessions after password reset', async () => {
      const { prisma } = await import('../../config/database.js');

      // Create reset token
      const resetToken = await prisma.passwordResetToken.create({
        data: {
          userId: testData.user.id,
          token: 'session-delete-token',
          expires: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      // Create session
      await prisma.session.create({
        data: {
          userId: testData.user.id,
          sessionToken: 'test-session-token',
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      await request(app)
        .post('/api/password/reset-password')
        .send({
          token: resetToken.token,
          newPassword: 'anotherNewPassword123',
        })
        .expect(200);

      // Verify sessions are deleted
      const sessions = await prisma.session.findMany({
        where: { userId: testData.user.id },
      });
      expect(sessions.length).toBe(0);
    });
  });
});
