/**
 * AI Routes Integration Tests
 * Basic integration tests for AI endpoints
 */

import request from 'supertest';
import express from 'express';
import aiRoutes from '../routes/customer/ai.routes.js';
import { prisma } from '../config/database.js';

// Mock services
jest.mock('../services/ai.service.js');
jest.mock('../services/credit.service.js');
jest.mock('../middleware/auth.js', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      userId: 'test-user-id',
      email: 'test@example.com',
      orgId: 'test-org-id',
      role: 'EDITOR',
    };
    next();
  },
}));
jest.mock('../middleware/authorize.js', () => ({
  requireRole: () => (req: any, res: any, next: any) => next(),
}));

const app = express();
app.use(express.json());
app.use('/organization', aiRoutes);

describe('AI Routes', () => {
  beforeAll(async () => {
    // Setup test database if needed
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /:orgId/ai/credits', () => {
    it('should return credit balance', async () => {
      const { CreditService } = await import('../services/credit.service.js');
      const mockBalance = {
        currentBalance: 100,
        monthlyAllowance: 500,
        totalUsed: 400,
        planName: 'PRO',
        nextReset: new Date(),
      };

      (CreditService.getBalance as jest.Mock).mockResolvedValue(mockBalance);

      const response = await request(app).get('/organization/test-org-id/ai/credits');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockBalance);
    });
  });

  describe('POST /:orgId/ai/generate-description', () => {
    it('should generate description with sufficient credits', async () => {
      const { AIService } = await import('../services/ai.service.js');
      const { CreditService } = await import('../services/credit.service.js');

      (CreditService.checkCredits as jest.Mock).mockResolvedValue({
        hasEnoughCredits: true,
        currentBalance: 100,
        required: 1,
      });

      (AIService.generateItemDescription as jest.Mock).mockResolvedValue({
        content: 'A delicious grilled salmon dish',
        tokensUsed: 150,
        model: 'gpt-3.5-turbo',
      });

      (AIService.calculateCreditCost as jest.Mock).mockReturnValue(1);
      (CreditService.deductCredits as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/organization/test-org-id/ai/generate-description')
        .send({
          itemName: 'Grilled Salmon',
          category: 'Main Course',
          language: 'en',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('A delicious grilled salmon dish');
      expect(response.body.data.creditsUsed).toBe(1);
    });

    it('should fail with insufficient credits', async () => {
      const { CreditService } = await import('../services/credit.service.js');

      (CreditService.checkCredits as jest.Mock).mockResolvedValue({
        hasEnoughCredits: false,
        currentBalance: 0,
        required: 1,
      });

      const response = await request(app)
        .post('/organization/test-org-id/ai/generate-description')
        .send({
          itemName: 'Grilled Salmon',
          category: 'Main Course',
          language: 'en',
        });

      expect(response.status).toBe(402);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient Credits');
    });
  });

  describe('GET /:orgId/ai/transactions', () => {
    it('should return transaction history', async () => {
      const { CreditService } = await import('../services/credit.service.js');
      const mockHistory = {
        transactions: [
          {
            id: '1',
            amount: -10,
            balance: 90,
            type: 'USAGE',
            feature: 'DESCRIPTION',
            createdAt: new Date(),
          },
        ],
        pagination: {
          total: 1,
          limit: 10,
          offset: 0,
        },
      };

      (CreditService.getTransactionHistory as jest.Mock).mockResolvedValue(mockHistory);

      const response = await request(app).get('/organization/test-org-id/ai/transactions');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(1);
    });
  });

  describe('GET /:orgId/ai/usage-stats', () => {
    it('should return usage statistics', async () => {
      const { CreditService } = await import('../services/credit.service.js');
      const mockStats = {
        totalCreditsUsed: 400,
        totalTransactions: 50,
        byFeature: {
          DESCRIPTION: { count: 30, totalCredits: 300 },
          TRANSLATION: { count: 20, totalCredits: 100 },
        },
        byDay: {},
      };

      (CreditService.getUsageStats as jest.Mock).mockResolvedValue(mockStats);

      const response = await request(app).get('/organization/test-org-id/ai/usage-stats?days=30');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalCreditsUsed).toBe(400);
      expect(response.body.data.totalTransactions).toBe(50);
    });
  });

  describe('GET /:orgId/ai/packages', () => {
    it('should return available credit packages', async () => {
      const { CreditService } = await import('../services/credit.service.js');
      const mockPackages = [
        {
          id: '1',
          name: 'Small Package',
          credits: 500,
          price: 4.99,
          discount: 0,
          isActive: true,
        },
      ];

      (CreditService.getAvailablePackages as jest.Mock).mockResolvedValue(mockPackages);

      const response = await request(app).get('/organization/test-org-id/ai/packages');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });
});
