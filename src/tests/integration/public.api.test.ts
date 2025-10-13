/**
 * Public API Integration Tests
 * Tests for public menu viewing endpoints
 */

import request from 'supertest';
import app from '../../index.js';
import { TestDb } from '../helpers/testDb.js';

describe('Public API', () => {
  let testData: any;

  beforeAll(async () => {
    testData = await TestDb.createTestSetup();
  });

  afterAll(async () => {
    await TestDb.cleanup();
  });

  describe('GET /api/public/menu/:shortId', () => {
    it('should get menu by QR code shortId', async () => {
      const response = await request(app)
        .get(`/api/public/menu/${testData.qrCode.shortId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.menu).toBeDefined();
      expect(response.body.data.menu.id).toBe(testData.menu.id);
      expect(response.body.data.menu.organization).toBeDefined();
      expect(response.body.data.menu.organization.name).toBe(testData.org.name);
      expect(response.body.data.theme).toBeDefined();
    });

    it('should return 404 for non-existent shortId', async () => {
      const response = await request(app)
        .get('/api/public/menu/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for inactive menu', async () => {
      const { prisma } = await import('../../config/database.js');

      // Deactivate menu
      await prisma.menu.update({
        where: { id: testData.menu.id },
        data: { isActive: false },
      });

      const response = await request(app)
        .get(`/api/public/menu/${testData.qrCode.shortId}`)
        .expect(404);

      expect(response.body.success).toBe(false);

      // Reactivate for other tests
      await prisma.menu.update({
        where: { id: testData.menu.id },
        data: { isActive: true },
      });
    });

    it('should only show available items', async () => {
      const response = await request(app)
        .get(`/api/public/menu/${testData.qrCode.shortId}`)
        .expect(200);

      const categories = response.body.data.menu.categories;
      categories.forEach((category: any) => {
        category.items.forEach((item: any) => {
          expect(item.isAvailable).toBe(true);
        });
      });
    });
  });

  describe('POST /api/public/menu/:shortId/scan', () => {
    it('should track QR code scan', async () => {
      const response = await request(app)
        .post(`/api/public/menu/${testData.qrCode.shortId}/scan`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Scan tracked');
    });

    it('should create activity log for scan', async () => {
      const { prisma } = await import('../../config/database.js');

      const beforeCount = await prisma.activityLog.count({
        where: {
          orgId: testData.org.id,
          action: 'QR_SCAN',
        },
      });

      await request(app)
        .post(`/api/public/menu/${testData.qrCode.shortId}/scan`)
        .expect(200);

      const afterCount = await prisma.activityLog.count({
        where: {
          orgId: testData.org.id,
          action: 'QR_SCAN',
        },
      });

      expect(afterCount).toBe(beforeCount + 1);
    });

    it('should return success even for non-existent shortId (silent fail)', async () => {
      const response = await request(app)
        .post('/api/public/menu/nonexistent/scan')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
