/**
 * Activity Log API Integration Tests
 */

import request from 'supertest';
import app from '../../index.js';
import { TestDb } from '../helpers/testDb.js';

describe('Activity Log API', () => {
  let testData: any;
  let token: string;

  beforeAll(async () => {
    testData = await TestDb.createTestSetup();
    token = testData.token;
  });

  afterAll(async () => {
    await TestDb.cleanup();
  });

  describe('GET /api/organization/:orgId/logs', () => {
    it('should get activity logs for organization', async () => {
      const { prisma } = await import('../../config/database.js');

      // Create some activity logs
      await prisma.activityLog.createMany({
        data: [
          {
            orgId: testData.org.id,
            userId: testData.user.id,
            action: 'MENU_CREATED',
            details: { menuName: 'Test Menu' },
          },
          {
            orgId: testData.org.id,
            userId: testData.user.id,
            action: 'ITEM_UPDATED',
            details: { itemName: 'Test Item' },
          },
        ],
      });

      const response = await request(app)
        .get(`/api/organization/${testData.org.id}/logs`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toBeDefined();
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/api/organization/${testData.org.id}/logs?page=1&limit=5`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(5);
      expect(response.body.data.data.length).toBeLessThanOrEqual(5);
    });

    it('should filter by action', async () => {
      const { prisma } = await import('../../config/database.js');

      await prisma.activityLog.create({
        data: {
          orgId: testData.org.id,
          action: 'QR_SCAN',
          details: { shortId: 'test123' },
        },
      });

      const response = await request(app)
        .get(`/api/organization/${testData.org.id}/logs?action=QR_SCAN`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.data.forEach((log: any) => {
        expect(log.action).toBe('QR_SCAN');
      });
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get(`/api/organization/${testData.org.id}/logs`)
        .expect(401);
    });

    it('should fail for organization user does not belong to', async () => {
      const { prisma } = await import('../../config/database.js');

      // Create another organization
      const otherOrg = await prisma.organization.create({
        data: {
          name: 'Other Restaurant',
          slug: 'other-restaurant',
        },
      });

      const response = await request(app)
        .get(`/api/organization/${otherOrg.id}/logs`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);

      // Cleanup
      await prisma.organization.delete({ where: { id: otherOrg.id } });
    });
  });

  describe('GET /api/organization/:orgId/logs/stats', () => {
    it('should get activity statistics', async () => {
      const { prisma } = await import('../../config/database.js');

      // Create varied activity logs
      await prisma.activityLog.createMany({
        data: [
          {
            orgId: testData.org.id,
            action: 'MENU_CREATED',
            details: {},
          },
          {
            orgId: testData.org.id,
            action: 'MENU_CREATED',
            details: {},
          },
          {
            orgId: testData.org.id,
            action: 'ITEM_CREATED',
            details: {},
          },
        ],
      });

      const response = await request(app)
        .get(`/api/organization/${testData.org.id}/logs/stats`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.actionCounts).toBeDefined();
      expect(Array.isArray(response.body.data.actionCounts)).toBe(true);
      expect(response.body.data.recentCount).toBeDefined();
      expect(typeof response.body.data.recentCount).toBe('number');
    });

    it('should count actions correctly', async () => {
      const { prisma } = await import('../../config/database.js');

      // Clean previous logs for this test
      await prisma.activityLog.deleteMany({
        where: { orgId: testData.org.id },
      });

      // Create specific logs
      await prisma.activityLog.createMany({
        data: [
          { orgId: testData.org.id, action: 'TEST_ACTION_A', details: {} },
          { orgId: testData.org.id, action: 'TEST_ACTION_A', details: {} },
          { orgId: testData.org.id, action: 'TEST_ACTION_B', details: {} },
        ],
      });

      const response = await request(app)
        .get(`/api/organization/${testData.org.id}/logs/stats`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const actionCounts = response.body.data.actionCounts;
      const actionA = actionCounts.find((ac: any) => ac.action === 'TEST_ACTION_A');
      const actionB = actionCounts.find((ac: any) => ac.action === 'TEST_ACTION_B');

      expect(actionA?.count).toBe(2);
      expect(actionB?.count).toBe(1);
    });

    it('should count recent activity (last 7 days)', async () => {
      const { prisma } = await import('../../config/database.js');

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const response = await request(app)
        .get(`/api/organization/${testData.org.id}/logs/stats`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.recentCount).toBeGreaterThanOrEqual(0);
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get(`/api/organization/${testData.org.id}/logs/stats`)
        .expect(401);
    });
  });
});
