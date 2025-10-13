/**
 * Email Verification API Integration Tests
 */

import request from 'supertest';
import app from '../../index.js';
import { TestDb } from '../helpers/testDb.js';

describe('Email Verification API', () => {
  let testData: any;
  let token: string;

  beforeAll(async () => {
    testData = await TestDb.createTestSetup();
    token = testData.token;
  });

  afterAll(async () => {
    await TestDb.cleanup();
  });

  describe('POST /api/verify/send-verification', () => {
    it('should send verification email', async () => {
      const response = await request(app)
        .post('/api/verify/send-verification')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Verification email sent');
      expect(response.body.data.verificationLink).toBeDefined();
    });

    it('should fail without authentication', async () => {
      await request(app)
        .post('/api/verify/send-verification')
        .expect(401);
    });

    it('should fail if email already verified', async () => {
      const { prisma } = await import('../../config/database.js');

      // Mark as verified
      await prisma.user.update({
        where: { id: testData.user.id },
        data: { emailVerified: true },
      });

      const response = await request(app)
        .post('/api/verify/send-verification')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);

      // Reset for other tests
      await prisma.user.update({
        where: { id: testData.user.id },
        data: { emailVerified: false },
      });
    });
  });

  describe('POST /api/verify/verify-email', () => {
    it('should verify email with valid token', async () => {
      const { prisma } = await import('../../config/database.js');

      // Create verification token
      const verificationToken = await prisma.verificationToken.create({
        data: {
          identifier: testData.user.email,
          token: 'test-verification-token',
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const response = await request(app)
        .post('/api/verify/verify-email')
        .send({ token: verificationToken.token })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('verified successfully');
      expect(response.body.data.emailVerified).toBe(true);

      // Verify user is actually verified
      const user = await prisma.user.findUnique({
        where: { id: testData.user.id },
      });
      expect(user?.emailVerified).toBe(true);

      // Reset for other tests
      await prisma.user.update({
        where: { id: testData.user.id },
        data: { emailVerified: false },
      });
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/verify/verify-email')
        .send({ token: 'invalid-token' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should fail with expired token', async () => {
      const { prisma } = await import('../../config/database.js');

      // Create expired token
      const expiredToken = await prisma.verificationToken.create({
        data: {
          identifier: testData.user.email,
          token: 'expired-token',
          expires: new Date(Date.now() - 1000), // Already expired
        },
      });

      const response = await request(app)
        .post('/api/verify/verify-email')
        .send({ token: expiredToken.token })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });

    it('should fail without token', async () => {
      await request(app)
        .post('/api/verify/verify-email')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/verify/resend-verification', () => {
    it('should resend verification email', async () => {
      const response = await request(app)
        .post('/api/verify/resend-verification')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('resent');
    });

    it('should delete old tokens before creating new one', async () => {
      const { prisma } = await import('../../config/database.js');

      // Create old token
      await prisma.verificationToken.create({
        data: {
          identifier: testData.user.email,
          token: 'old-token',
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      await request(app)
        .post('/api/verify/resend-verification')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Check old token is deleted
      const oldToken = await prisma.verificationToken.findUnique({
        where: { token: 'old-token' },
      });
      expect(oldToken).toBeNull();
    });
  });
});
