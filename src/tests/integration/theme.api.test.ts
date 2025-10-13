/**
 * Theme API Integration Tests
 */

import request from 'supertest';
import app from '../../index.js';
import { TestDb } from '../helpers/testDb.js';

describe('Theme API', () => {
  let testData: any;
  let token: string;

  beforeAll(async () => {
    testData = await TestDb.createTestSetup();
    token = testData.token;
  });

  afterAll(async () => {
    await TestDb.cleanup();
  });

  describe('GET /api/theme/:orgId', () => {
    it('should get theme settings', async () => {
      const response = await request(app)
        .get(`/api/theme/${testData.org.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.orgId).toBe(testData.org.id);
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get(`/api/theme/${testData.org.id}`)
        .expect(401);
    });

    it('should fail for organization user does not belong to', async () => {
      const { prisma } = await import('../../config/database.js');

      const otherOrg = await prisma.organization.create({
        data: {
          name: 'Other Restaurant',
          slug: 'other-restaurant-theme',
        },
      });

      const response = await request(app)
        .get(`/api/theme/${otherOrg.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);

      await prisma.organization.delete({ where: { id: otherOrg.id } });
    });
  });

  describe('POST /api/theme/:orgId', () => {
    it('should create theme settings', async () => {
      const { prisma } = await import('../../config/database.js');

      // Create new org without theme
      const newOrg = await prisma.organization.create({
        data: {
          name: 'New Restaurant',
          slug: 'new-restaurant-theme',
        },
      });

      // Add user to org
      await prisma.userOrganization.create({
        data: {
          userId: testData.user.id,
          orgId: newOrg.id,
          role: 'OWNER',
        },
      });

      const response = await request(app)
        .post(`/api/theme/${newOrg.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          themeKey: 'elegant',
          primary: '#9333EA',
          accent: '#EC4899',
          customCss: '.menu { border-radius: 10px; }',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.themeKey).toBe('elegant');
      expect(response.body.data.primary).toBe('#9333EA');
      expect(response.body.data.accent).toBe('#EC4899');

      // Cleanup
      await prisma.organization.delete({ where: { id: newOrg.id } });
    });

    it('should fail if theme already exists', async () => {
      const response = await request(app)
        .post(`/api/theme/${testData.org.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          themeKey: 'default',
          primary: '#3B82F6',
          accent: '#10B981',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      await request(app)
        .post(`/api/theme/${testData.org.id}`)
        .send({
          themeKey: 'test',
          primary: '#000000',
        })
        .expect(401);
    });
  });

  describe('PUT /api/theme/:orgId', () => {
    it('should update theme settings', async () => {
      const response = await request(app)
        .put(`/api/theme/${testData.org.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          primary: '#EF4444',
          accent: '#F59E0B',
          themeKey: 'custom',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.primary).toBe('#EF4444');
      expect(response.body.data.accent).toBe('#F59E0B');
      expect(response.body.data.themeKey).toBe('custom');
    });

    it('should update only provided fields', async () => {
      const { prisma } = await import('../../config/database.js');

      // Get current theme
      const beforeTheme = await prisma.themeSetting.findUnique({
        where: { orgId: testData.org.id },
      });

      const response = await request(app)
        .put(`/api/theme/${testData.org.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          primary: '#10B981',
        })
        .expect(200);

      expect(response.body.data.primary).toBe('#10B981');
      expect(response.body.data.accent).toBe(beforeTheme?.accent); // Unchanged
    });

    it('should update custom CSS', async () => {
      const customCss = '.menu-item { padding: 20px; }';

      const response = await request(app)
        .put(`/api/theme/${testData.org.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          customCss,
        })
        .expect(200);

      expect(response.body.data.customCss).toBe(customCss);
    });

    it('should fail without authentication', async () => {
      await request(app)
        .put(`/api/theme/${testData.org.id}`)
        .send({ primary: '#000000' })
        .expect(401);
    });

    it('should fail for organization user does not belong to', async () => {
      const { prisma } = await import('../../config/database.js');

      const otherOrg = await prisma.organization.create({
        data: {
          name: 'Other Restaurant Update',
          slug: 'other-restaurant-update-theme',
        },
      });

      const response = await request(app)
        .put(`/api/theme/${otherOrg.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ primary: '#000000' })
        .expect(403);

      expect(response.body.success).toBe(false);

      await prisma.organization.delete({ where: { id: otherOrg.id } });
    });
  });
});
