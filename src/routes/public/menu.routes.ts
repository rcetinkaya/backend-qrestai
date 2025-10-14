/**
 * Public Menu Routes
 * No authentication required - for customers viewing menus
 */

import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../types/errors.js';
import { AnalyticsService } from '../../services/analytics.service.js';

const router = Router();

// Get menu by QR code shortId (public)
router.get('/:shortId', async (req, res, next) => {
  try {
    const { shortId } = req.params;

    // Find QR code
    const qrCode = await prisma.qrCode.findUnique({
      where: { shortId },
      include: {
        menu: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            categories: {
              where: {
                // Only show categories with available items
              },
              include: {
                items: {
                  where: {
                    isAvailable: true,
                  },
                  orderBy: {
                    sortOrder: 'asc',
                  },
                },
              },
              orderBy: {
                sortOrder: 'asc',
              },
            },
          },
        },
      },
    });

    if (!qrCode) {
      throw new NotFoundError('Menu not found');
    }

    // Check if menu is active
    if (!qrCode.menu.isActive) {
      throw new NotFoundError('Menu is not available');
    }

    // Get theme settings for the organization
    const theme = await prisma.themeSetting.findUnique({
      where: {
        orgId: qrCode.menu.orgId,
      },
      select: {
        themeKey: true,
        primary: true,
        accent: true,
        customCss: true,
      },
    });

    res.json({
      success: true,
      data: {
        menu: qrCode.menu,
        theme,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Track QR code scan (analytics)
router.post('/:shortId/scan', async (req, res, _next) => {
  try {
    const { shortId } = req.params;
    const { viewType = 'QR_SCAN' } = req.body;

    // Find QR code and menu
    const qrCode = await prisma.qrCode.findUnique({
      where: { shortId },
      select: {
        menuId: true,
        menu: {
          select: {
            id: true,
            orgId: true,
            name: true,
          },
        },
      },
    });

    if (qrCode) {
      // Track the view
      await AnalyticsService.trackMenuView(
        qrCode.menuId,
        viewType as 'QR_SCAN' | 'DIRECT_LINK' | 'PREVIEW',
        {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip || req.headers['x-forwarded-for'] as string,
          referer: req.headers['referer'],
          sessionId: (req as any).sessionID,
        }
      );

      // Log in activity log
      await prisma.activityLog.create({
        data: {
          orgId: qrCode.menu.orgId,
          action: viewType === 'QR_SCAN' ? 'QR_SCAN' : 'MENU_VIEW',
          details: {
            shortId,
            menuName: qrCode.menu.name,
            viewType,
            timestamp: new Date().toISOString(),
            userAgent: req.headers['user-agent'],
          },
        },
      });
    }

    res.json({ success: true, message: 'View tracked' });
  } catch (error) {
    // Silent fail for analytics - don't break user experience
    res.json({ success: true, message: 'View tracked' });
  }
});

export default router;
