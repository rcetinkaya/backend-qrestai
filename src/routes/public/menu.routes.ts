/**
 * Public Menu Routes
 * No authentication required - for customers viewing menus
 */

import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../types/errors.js';
import { AnalyticsService } from '../../services/analytics.service.js';

const router = Router();

// Get menu by ID or QR code shortId (public)
router.get('/:identifier', async (req, res, next) => {
  try {
    const { identifier } = req.params;
    let menu = null;

    // Try to find by QR code shortId first
    const qrCode = await prisma.qrCode.findUnique({
      where: { shortId: identifier },
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

    if (qrCode) {
      menu = qrCode.menu;
    } else {
      // If not found by shortId, try by menu ID
      menu = await prisma.menu.findUnique({
        where: { id: identifier },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          categories: {
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
      });
    }

    if (!menu) {
      console.error(`Menu not found with identifier: ${identifier}`);
      throw new NotFoundError('Menu not found');
    }

    console.log(`Menu found: ${menu.id}, isActive: ${menu.isActive}`);

    // Check if menu is active
    if (!menu.isActive) {
      console.warn(`Menu ${menu.id} is not active`);
      throw new NotFoundError('Menu is not available - Please activate the menu from dashboard');
    }

    // Get theme settings for the organization
    const theme = await prisma.themeSetting.findUnique({
      where: {
        orgId: menu.orgId,
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
        menu,
        theme,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Track QR code scan (analytics)
router.post('/:identifier/scan', async (req, res, _next) => {
  try {
    const { identifier } = req.params;
    const { viewType = 'QR_SCAN' } = req.body;

    // Find QR code and menu - try both shortId and menuId
    let qrCode = await prisma.qrCode.findUnique({
      where: { shortId: identifier },
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

    // If not found by shortId, try finding by menuId
    if (!qrCode) {
      const menu = await prisma.menu.findUnique({
        where: { id: identifier },
        select: {
          id: true,
          orgId: true,
          name: true,
        },
      });

      if (menu) {
        // Create a pseudo qrCode object for tracking
        qrCode = {
          menuId: menu.id,
          menu: menu,
        } as any;
      }
    }

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
            identifier,
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
