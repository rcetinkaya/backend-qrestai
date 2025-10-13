/**
 * Dashboard Routes
 * Statistics and overview data
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { prisma } from '../../config/database.js';
import { AuthorizationError } from '../../types/errors.js';

const router = Router();

// Get dashboard statistics
router.get('/:orgId/stats', authenticate, async (req, res, next) => {
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

    // Get counts
    const [menusCount, categoriesCount, itemsCount, qrScansCount] = await Promise.all([
      // Menus count
      prisma.menu.count({
        where: { orgId },
      }),

      // Categories count
      prisma.category.count({
        where: {
          menu: {
            orgId,
          },
        },
      }),

      // Items count
      prisma.menuItem.count({
        where: {
          category: {
            menu: {
              orgId,
            },
          },
        },
      }),

      // QR scans count (from activity logs)
      prisma.activityLog.count({
        where: {
          orgId,
          action: 'QR_SCAN',
        },
      }),
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentScans = await prisma.activityLog.count({
      where: {
        orgId,
        action: 'QR_SCAN',
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Get organization details
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        plan: true,
        status: true,
        aiCredits: true,
      },
    });

    // Get team size
    const teamSize = await prisma.userOrganization.count({
      where: { orgId },
    });

    // Get most viewed menus (top 5)
    const topMenus = await prisma.activityLog.groupBy({
      by: ['details'],
      where: {
        orgId,
        action: 'QR_SCAN',
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    // Get daily scans for last 7 days
    const dailyScans = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM activity_logs
      WHERE
        "orgId" = ${orgId}
        AND action = 'QR_SCAN'
        AND "createdAt" >= ${sevenDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    res.json({
      success: true,
      data: {
        counts: {
          menus: menusCount,
          categories: categoriesCount,
          items: itemsCount,
          totalScans: qrScansCount,
          recentScans,
          teamMembers: teamSize,
        },
        organization: {
          plan: organization?.plan,
          status: organization?.status,
          aiTokens: organization?.aiCredits,
        },
        topMenus: topMenus.map((tm) => ({
          menuName: (tm.details as any)?.menuName || 'Unknown',
          scans: Number(tm._count.id),
        })),
        dailyScans: dailyScans.map((ds) => ({
          date: ds.date,
          count: Number(ds.count),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get recent activities
router.get('/:orgId/recent-activity', authenticate, async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 10;

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

    const activities = await prisma.activityLog.findMany({
      where: { orgId },
      select: {
        id: true,
        action: true,
        details: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
