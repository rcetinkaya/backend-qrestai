/**
 * Analytics Service
 * Track menu views and QR scans
 */

import { prisma } from '../config/database.js';

export class AnalyticsService {
  /**
   * Track menu view
   */
  static async trackMenuView(
    menuId: string,
    viewType: 'QR_SCAN' | 'DIRECT_LINK' | 'PREVIEW',
    metadata?: {
      userAgent?: string;
      ipAddress?: string;
      referer?: string;
      sessionId?: string;
      country?: string;
      city?: string;
    }
  ) {
    try {
      // Create view record
      await prisma.menuView.create({
        data: {
          menuId,
          viewType,
          userAgent: metadata?.userAgent,
          ipAddress: metadata?.ipAddress,
          referer: metadata?.referer,
          sessionId: metadata?.sessionId,
          country: metadata?.country,
          city: metadata?.city,
        },
      });

      // Increment counter on Menu model
      const updateData: any = {
        viewCount: { increment: 1 },
      };

      // If it's a QR scan, also increment QR scan counter
      if (viewType === 'QR_SCAN') {
        updateData.qrScanCount = { increment: 1 };
      }

      await prisma.menu.update({
        where: { id: menuId },
        data: updateData,
      });

      return true;
    } catch (error) {
      console.error('Failed to track menu view:', error);
      // Don't fail the main request if analytics fails
      return false;
    }
  }

  /**
   * Get menu analytics
   */
  static async getMenuAnalytics(menuId: string, orgId: string) {
    const menu = await prisma.menu.findFirst({
      where: { id: menuId, orgId },
      select: {
        id: true,
        name: true,
        viewCount: true,
        qrScanCount: true,
        createdAt: true,
      },
    });

    if (!menu) {
      throw new Error('Menu not found');
    }

    // Get view breakdown by type
    const viewsByType = await prisma.menuView.groupBy({
      by: ['viewType'],
      where: { menuId },
      _count: {
        _all: true,
      },
    });

    // Get recent views (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentViews = await prisma.menuView.count({
      where: {
        menuId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Get views by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const viewsByDay = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT
        DATE("createdAt") as date,
        COUNT(*)::integer as count
      FROM "menu_views"
      WHERE "menuId" = ${menuId}
        AND "createdAt" >= ${sevenDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
    `;

    return {
      menu: {
        id: menu.id,
        name: menu.name,
        createdAt: menu.createdAt,
      },
      totals: {
        totalViews: menu.viewCount,
        qrScans: menu.qrScanCount,
        directLinks: menu.viewCount - menu.qrScanCount,
      },
      viewsByType: viewsByType.map((item) => ({
        type: item.viewType,
        count: item._count._all,
      })),
      recentViews: {
        last30Days: recentViews,
      },
      viewsByDay: viewsByDay.map((item) => ({
        date: item.date,
        count: Number(item.count),
      })),
    };
  }

  /**
   * Get organization-wide analytics
   */
  static async getOrganizationAnalytics(orgId: string) {
    // Get all menus with their view counts
    const menus = await prisma.menu.findMany({
      where: { orgId },
      select: {
        id: true,
        name: true,
        viewCount: true,
        qrScanCount: true,
        createdAt: true,
      },
      orderBy: { viewCount: 'desc' },
    });

    const totalViews = menus.reduce((sum, menu) => sum + menu.viewCount, 0);
    const totalScans = menus.reduce((sum, menu) => sum + menu.qrScanCount, 0);

    return {
      totals: {
        totalMenus: menus.length,
        totalViews,
        totalScans,
      },
      topMenus: menus.slice(0, 5),
    };
  }
}
