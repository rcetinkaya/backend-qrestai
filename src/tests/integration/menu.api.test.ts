/**
 * Menu API Integration Tests
 */

import request from 'supertest';
import express from 'express';
import { TestDb } from '../helpers/testDb.js';
import { TestTokens } from '../helpers/testTokens.js';
import menuRoutes from '../../routes/customer/menu.routes.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import { Role } from '@prisma/client';

const app = express();
app.use(express.json());
app.use('/menus', menuRoutes);
app.use(errorHandler);

describe('Menu API', () => {
  beforeEach(async () => {
    await TestDb.cleanup();
  });

  describe('GET /menus', () => {
    it('should return paginated menus', async () => {
      const org = await TestDb.createOrganization();
      const user = await TestDb.createUser();
      await TestDb.linkUserToOrg(user.id, org.id, Role.OWNER);
      await TestDb.createMenu(org.id, { name: 'Menu 1' });
      await TestDb.createMenu(org.id, { name: 'Menu 2' });

      const token = TestTokens.generateAccessToken({
        userId: user.id,
        email: user.email,
        orgId: org.id,
        role: Role.OWNER,
      });

      const response = await request(app)
        .get('/menus')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/menus');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /menus/:id', () => {
    it('should return menu with categories', async () => {
      const { user, org, menu } = await TestDb.createTestSetup();
      const category = await TestDb.createCategory(menu.id);
      await TestDb.createMenuItem(category.id);

      const token = TestTokens.generateAccessToken({
        userId: user.id,
        email: user.email,
        orgId: org.id,
      });

      const response = await request(app)
        .get(`/menus/${menu.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.categories).toHaveLength(1);
      expect(response.body.data.categories[0].items).toHaveLength(1);
    });

    it('should return 404 for nonexistent menu', async () => {
      const { user, org } = await TestDb.createTestSetup();
      const token = TestTokens.generateAccessToken({
        userId: user.id,
        email: user.email,
        orgId: org.id,
      });

      // Use valid CUID format but nonexistent ID
      const nonExistentId = 'clz0000000000000000000000';
      const response = await request(app)
        .get(`/menus/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /menus', () => {
    it('should create menu with EDITOR role', async () => {
      const { user, org } = await TestDb.createTestSetup();
      const token = TestTokens.generateAccessToken({
        userId: user.id,
        email: user.email,
        orgId: org.id,
        role: Role.EDITOR,
      });

      const response = await request(app)
        .post('/menus')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Menu',
          locale: 'en',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('New Menu');
    });

    it('should return 403 with VIEWER role', async () => {
      const { user, org } = await TestDb.createTestSetup();
      const token = TestTokens.generateAccessToken({
        userId: user.id,
        email: user.email,
        orgId: org.id,
        role: Role.VIEWER,
      });

      const response = await request(app)
        .post('/menus')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Menu',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /menus/:id', () => {
    it('should update menu', async () => {
      const { user, org, menu } = await TestDb.createTestSetup();
      const token = TestTokens.generateAccessToken({
        userId: user.id,
        email: user.email,
        orgId: org.id,
        role: Role.EDITOR,
      });

      const response = await request(app)
        .put(`/menus/${menu.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Menu',
          isActive: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Menu');
      expect(response.body.data.isActive).toBe(false);
    });
  });

  describe('DELETE /menus/:id', () => {
    it('should delete menu with ADMIN role', async () => {
      const { user, org, menu } = await TestDb.createTestSetup();
      const token = TestTokens.generateAccessToken({
        userId: user.id,
        email: user.email,
        orgId: org.id,
        role: Role.ADMIN,
      });

      const response = await request(app)
        .delete(`/menus/${menu.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it('should return 403 with EDITOR role', async () => {
      const { user, org, menu } = await TestDb.createTestSetup();
      const token = TestTokens.generateAccessToken({
        userId: user.id,
        email: user.email,
        orgId: org.id,
        role: Role.EDITOR,
      });

      const response = await request(app)
        .delete(`/menus/${menu.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /menus/:id/duplicate', () => {
    it('should duplicate menu with all content', async () => {
      const { user, org, menu } = await TestDb.createTestSetup();
      const category = await TestDb.createCategory(menu.id);
      await TestDb.createMenuItem(category.id);

      const token = TestTokens.generateAccessToken({
        userId: user.id,
        email: user.email,
        orgId: org.id,
        role: Role.EDITOR,
      });

      const response = await request(app)
        .post(`/menus/${menu.id}/duplicate`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(201);
      expect(response.body.data.name).toContain('(Copy)');
      expect(response.body.data.id).not.toBe(menu.id);
    });
  });
});
