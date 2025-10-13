/**
 * Activity Log Routes
 * For viewing organization activity logs
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { prisma } from '../../config/database.js';
import { AuthorizationError } from '../../types/errors.js';

const router = Router();

// Get activity logs for organization
router.get('/:orgId/logs', authenticate, async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const action = req.query.action as string;

    const skip = (page - 1) * limit;

    // Check if user belongs to organization
    const userOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });

    if (!userOrg) {
      throw new AuthorizationError('You do not have access to this organization');
    }

    const where: any = {
      orgId,
    };

    if (action) {
      where.action = action;
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          details: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get activity log statistics
router.get('/:orgId/logs/stats', authenticate, async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const userId = req.user!.userId;

    // Check if user belongs to organization
    const userOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });

    if (!userOrg) {
      throw new AuthorizationError('You do not have access to this organization');
    }

    // Get action counts
    const actionCounts = await prisma.activityLog.groupBy({
      by: ['action'],
      where: { orgId },
      _count: {
        action: true,
      },
    });

    // Get recent activity count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCount = await prisma.activityLog.count({
      where: {
        orgId,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    res.json({
      success: true,
      data: {
        actionCounts: actionCounts.map((ac) => ({
          action: ac.action,
          count: ac._count.action,
        })),
        recentCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
