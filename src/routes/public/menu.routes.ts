/**
 * Public Menu Routes
 * No authentication required - for customers viewing menus
 */

import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../types/errors.js';

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

    // Update scan count
    // TODO: Re-implement scan tracking with new schema
    // await prisma.qrCode.updateMany({
    //   where: { shortId },
    //   data: {
    //     scans: {
    //       increment: 1,
    //     },
    //   },
    // });

    // Optionally log the scan in ActivityLog
    const qrCode = await prisma.qrCode.findUnique({
      where: { shortId },
      select: {
        menu: {
          select: {
            orgId: true,
            name: true,
          },
        },
      },
    });

    if (qrCode) {
      await prisma.activityLog.create({
        data: {
          orgId: qrCode.menu.orgId,
          action: 'QR_SCAN',
          details: {
            shortId,
            menuName: qrCode.menu.name,
            timestamp: new Date().toISOString(),
            userAgent: req.headers['user-agent'],
          },
        },
      });
    }

    res.json({ success: true, message: 'Scan tracked' });
  } catch (error) {
    // Silent fail for analytics - don't break user experience
    res.json({ success: true, message: 'Scan tracked' });
  }
});

export default router;
