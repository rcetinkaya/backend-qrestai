/**
 * Auth API Integration Tests
 */

import request from 'supertest';
import express from 'express';
import { TestDb } from '../helpers/testDb.js';
import { TestTokens } from '../helpers/testTokens.js';
import authRoutes from '../../routes/customer/auth.routes.js';
import { errorHandler } from '../../middleware/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use(errorHandler);

describe('Auth API', () => {
  beforeEach(async () => {
    await TestDb.cleanup();
  });

  describe('POST /auth/register', () => {
    it('should register new user successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'Password123!',
          name: 'New User',
          organizationName: 'Test Org',
          organizationSlug: 'test-org',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.user.email).toBe('newuser@test.com');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          name: 'User',
          organizationName: 'Org',
          organizationSlug: 'org',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate email', async () => {
      await TestDb.createUser({ email: 'existing@test.com' });

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'existing@test.com',
          password: 'Password123!',
          name: 'User',
          organizationName: 'Org',
          organizationSlug: 'new-org',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const org = await TestDb.createOrganization();
      const user = await TestDb.createUser({
        email: 'user@test.com',
        password: 'password123',
      });
      await TestDb.linkUserToOrg(user.id, org.id);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@test.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@test.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user with valid token', async () => {
      const { user, org } = await TestDb.createTestSetup();
      const token = TestTokens.generateAccessToken({
        userId: user.id,
        email: user.email,
        orgId: org.id,
      });

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(user.email);
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
