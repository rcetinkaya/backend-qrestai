/**
 * Admin API Integration Tests
 */

import request from 'supertest';
import express from 'express';
import { TestDb } from '../helpers/testDb.js';
import { TestTokens } from '../helpers/testTokens.js';
import adminRoutes from '../../routes/admin/index.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import { Plan } from '@prisma/client';

const app = express();
app.use(express.json());
app.use('/admin', adminRoutes);
app.use(errorHandler);

describe('Admin API', () => {
  beforeEach(async () => {
    await TestDb.cleanup();
  });

  describe('GET /admin/organizations', () => {
    it('should return all organizations', async () => {
      const user = await TestDb.createUser();
      await TestDb.createOrganization({ name: 'Org 1', slug: 'org-1' });
      await TestDb.createOrganization({ name: 'Org 2', slug: 'org-2' });

      const token = TestTokens.generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      const response = await request(app)
        .get('/admin/organizations')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/admin/organizations');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /admin/organizations/:id', () => {
    it('should return organization details', async () => {
      const user = await TestDb.createUser();
      const org = await TestDb.createOrganization();

      const token = TestTokens.generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      const response = await request(app)
        .get(`/admin/organizations/${org.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(org.id);
      expect(response.body.data.name).toBe(org.name);
    });
  });

  describe('PUT /admin/organizations/:id', () => {
    it('should update organization', async () => {
      const user = await TestDb.createUser();
      const org = await TestDb.createOrganization();

      const token = TestTokens.generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      const response = await request(app)
        .put(`/admin/organizations/${org.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Org',
          plan: Plan.PRO,
          tokens: 10000,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Org');
      expect(response.body.data.plan).toBe(Plan.PRO);
      expect(response.body.data.tokens).toBe(10000);
    });
  });

  describe('GET /admin/menus', () => {
    it('should return all menus across organizations', async () => {
      const user = await TestDb.createUser();
      const org1 = await TestDb.createOrganization({ slug: 'org-1' });
      const org2 = await TestDb.createOrganization({ slug: 'org-2' });
      await TestDb.createMenu(org1.id, { name: 'Menu 1' });
      await TestDb.createMenu(org2.id, { name: 'Menu 2' });

      const token = TestTokens.generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      const response = await request(app)
        .get('/admin/menus')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.data.data[0]).toHaveProperty('organization');
    });

    it('should filter menus by search', async () => {
      const user = await TestDb.createUser();
      const org = await TestDb.createOrganization();
      await TestDb.createMenu(org.id, { name: 'Summer Menu' });
      await TestDb.createMenu(org.id, { name: 'Winter Menu' });

      const token = TestTokens.generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      const response = await request(app)
        .get('/admin/menus?search=Summer')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].name).toBe('Summer Menu');
    });
  });

  describe('GET /admin/menus/:id', () => {
    it('should return menu with full details', async () => {
      const user = await TestDb.createUser();
      const { menu } = await TestDb.createTestSetup();
      const category = await TestDb.createCategory(menu.id);
      await TestDb.createMenuItem(category.id);

      const token = TestTokens.generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      const response = await request(app)
        .get(`/admin/menus/${menu.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(menu.id);
      expect(response.body.data).toHaveProperty('organization');
      expect(response.body.data).toHaveProperty('categories');
      expect(response.body.data.categories).toHaveLength(1);
      expect(response.body.data.categories[0].items).toHaveLength(1);
    });
  });

  describe('DELETE /admin/menus/:id', () => {
    it('should delete menu', async () => {
      const user = await TestDb.createUser();
      const { menu } = await TestDb.createTestSetup();

      const token = TestTokens.generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      const response = await request(app)
        .delete(`/admin/menus/${menu.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
    });
  });

  describe('GET /admin/users', () => {
    it('should return all users', async () => {
      const adminUser = await TestDb.createUser({ email: 'admin@test.com' });
      await TestDb.createUser({ email: 'user1@test.com' });
      await TestDb.createUser({ email: 'user2@test.com' });

      const token = TestTokens.generateAccessToken({
        userId: adminUser.id,
        email: adminUser.email,
      });

      const response = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should search users by email', async () => {
      const adminUser = await TestDb.createUser({ email: 'admin@test.com' });
      await TestDb.createUser({ email: 'john@example.com', name: 'John Doe' });
      await TestDb.createUser({ email: 'jane@example.com', name: 'Jane Doe' });

      const token = TestTokens.generateAccessToken({
        userId: adminUser.id,
        email: adminUser.email,
      });

      const response = await request(app)
        .get('/admin/users?search=john')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].email).toBe('john@example.com');
    });
  });

  describe('GET /admin/users/:id', () => {
    it('should return user details with organizations', async () => {
      const adminUser = await TestDb.createUser({ email: 'admin@test.com' });
      const { user } = await TestDb.createTestSetup();

      const token = TestTokens.generateAccessToken({
        userId: adminUser.id,
        email: adminUser.email,
      });

      const response = await request(app)
        .get(`/admin/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.organizations).toHaveLength(1);
    });
  });

  describe('DELETE /admin/users/:id', () => {
    it('should delete user', async () => {
      const adminUser = await TestDb.createUser({ email: 'admin@test.com' });
      const userToDelete = await TestDb.createUser({ email: 'delete@test.com' });

      const token = TestTokens.generateAccessToken({
        userId: adminUser.id,
        email: adminUser.email,
      });

      const response = await request(app)
        .delete(`/admin/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
    });
  });
});
