/**
 * Credit Management Service
 * Handle AI credit balance, transactions, and limits
 */

import { prisma } from '../config/database.js';
import { BadRequestError } from '../types/errors.js';

export interface CreditCheckResult {
  hasEnoughCredits: boolean;
  currentBalance: number;
  requiredCredits: number;
  planLimit: number;
}

export class CreditService {
  /**
   * Check if organization has enough credits
   */
  static async checkCredits(orgId: string, requiredCredits: number): Promise<CreditCheckResult> {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        aiCredits: true,
        plan: true,
      },
    });

    if (!org) {
      throw new BadRequestError('Organization not found');
    }

    // Get plan details
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { name: org.plan },
    });

    return {
      hasEnoughCredits: org.aiCredits >= requiredCredits,
      currentBalance: org.aiCredits,
      requiredCredits,
      planLimit: plan?.aiCreditsMonthly || 0,
    };
  }

  /**
   * Deduct credits from organization
   */
  static async deductCredits(
    orgId: string,
    userId: string,
    amount: number,
    feature: string,
    metadata?: any
  ): Promise<void> {
    // Check if organization has enough credits
    const check = await this.checkCredits(orgId, amount);

    if (!check.hasEnoughCredits) {
      throw new BadRequestError(
        `Insufficient AI credits. Required: ${amount}, Available: ${check.currentBalance}`
      );
    }

    // Deduct credits and update organization
    const org = await prisma.organization.update({
      where: { id: orgId },
      data: {
        aiCredits: { decrement: amount },
        aiCreditsUsed: { increment: amount },
      },
    });

    // Create transaction record
    await prisma.aICreditTransaction.create({
      data: {
        orgId,
        userId,
        amount: -amount, // Negative for usage
        balance: org.aiCredits,
        type: 'USAGE',
        feature,
        metadata,
      },
    });
  }

  /**
   * Add credits to organization (purchase, bonus, etc.)
   */
  static async addCredits(
    orgId: string,
    userId: string | null,
    amount: number,
    type: 'PURCHASE' | 'BONUS' | 'REFUND' | 'MONTHLY_RESET',
    metadata?: any
  ): Promise<void> {
    // Add credits to organization
    const org = await prisma.organization.update({
      where: { id: orgId },
      data: {
        aiCredits: { increment: amount },
      },
    });

    // Create transaction record
    await prisma.aICreditTransaction.create({
      data: {
        orgId,
        userId,
        amount, // Positive for addition
        balance: org.aiCredits,
        type,
        metadata,
      },
    });
  }

  /**
   * Get credit balance for organization
   */
  static async getBalance(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        aiCredits: true,
        aiCreditsUsed: true,
        plan: true,
        creditResetDate: true,
      },
    });

    if (!org) {
      throw new BadRequestError('Organization not found');
    }

    // Get plan details
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { name: org.plan },
    });

    return {
      currentBalance: org.aiCredits,
      totalUsed: org.aiCreditsUsed,
      monthlyAllowance: plan?.aiCreditsMonthly || 0,
      nextResetDate: org.creditResetDate,
      planName: plan?.displayName || org.plan,
    };
  }

  /**
   * Get credit transaction history
   */
  static async getTransactionHistory(
    orgId: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: string;
      feature?: string;
    }
  ) {
    const { limit = 50, offset = 0, type, feature } = options || {};

    const where: any = { orgId };
    if (type) where.type = type;
    if (feature) where.feature = feature;

    const [transactions, total] = await Promise.all([
      prisma.aICreditTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.aICreditTransaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Get credit usage statistics
   */
  static async getUsageStats(orgId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get transactions within date range
    const transactions = await prisma.aICreditTransaction.findMany({
      where: {
        orgId,
        createdAt: { gte: startDate },
        type: 'USAGE',
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by feature
    const byFeature = transactions.reduce((acc: any, tx) => {
      const feature = tx.feature || 'Unknown';
      if (!acc[feature]) {
        acc[feature] = { count: 0, totalCredits: 0 };
      }
      acc[feature].count++;
      acc[feature].totalCredits += Math.abs(tx.amount);
      return acc;
    }, {});

    // Group by day
    const byDay = transactions.reduce((acc: any, tx) => {
      const day = tx.createdAt.toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = { count: 0, totalCredits: 0 };
      }
      acc[day].count++;
      acc[day].totalCredits += Math.abs(tx.amount);
      return acc;
    }, {});

    const totalCreditsUsed = transactions.reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0
    );

    return {
      totalCreditsUsed,
      totalTransactions: transactions.length,
      byFeature,
      byDay,
      period: {
        start: startDate,
        end: new Date(),
        days,
      },
    };
  }

  /**
   * Reset monthly credits (cron job function)
   */
  static async resetMonthlyCredits() {
    const organizations = await prisma.organization.findMany({
      where: {
        status: 'ACTIVE',
        creditResetDate: {
          lte: new Date(),
        },
      },
      select: {
        id: true,
        plan: true,
      },
    });

    for (const org of organizations) {
      // Get plan details
      const plan = await prisma.subscriptionPlan.findFirst({
        where: { name: org.plan },
      });

      if (!plan || plan.aiCreditsMonthly === -1) {
        // Unlimited plan, skip
        continue;
      }

      // Reset credits to monthly allowance
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          aiCredits: plan.aiCreditsMonthly,
          creditResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
        },
      });

      // Create transaction record
      await prisma.aICreditTransaction.create({
        data: {
          orgId: org.id,
          userId: null,
          amount: plan.aiCreditsMonthly,
          balance: plan.aiCreditsMonthly,
          type: 'MONTHLY_RESET',
          metadata: { planName: plan.name },
        },
      });
    }

    return {
      organizationsReset: organizations.length,
    };
  }

  /**
   * Purchase credit package
   */
  static async purchasePackage(
    orgId: string,
    userId: string,
    packageId: string
  ): Promise<void> {
    // Get package details
    const pkg = await prisma.creditPackage.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      throw new BadRequestError('Credit package not found');
    }

    if (!pkg.isActive) {
      throw new BadRequestError('This credit package is no longer available');
    }

    // TODO: Integrate with payment provider (Stripe, etc.)
    // For now, we'll just add the credits

    await this.addCredits(orgId, userId, pkg.credits, 'PURCHASE', {
      packageId: pkg.id,
      packageName: pkg.name,
      price: pkg.price,
      discount: pkg.discount,
    });
  }

  /**
   * Get available credit packages
   */
  static async getAvailablePackages() {
    return await prisma.creditPackage.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { credits: 'asc' }],
    });
  }

  /**
   * Set monthly credit reset date for new organization
   */
  static async initializeCreditReset(orgId: string) {
    const nextReset = new Date();
    nextReset.setMonth(nextReset.getMonth() + 1);
    nextReset.setDate(1); // First day of next month

    await prisma.organization.update({
      where: { id: orgId },
      data: {
        creditResetDate: nextReset,
      },
    });
  }
}
