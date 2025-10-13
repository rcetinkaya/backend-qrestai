/**
 * Admin Menu Management Routes
 * For system administrators to view and manage all menus across organizations
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../types/errors.js';

const router = Router();

// Get all menus (across all organizations)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const orgId = req.query.orgId as string;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (orgId) {
      where.orgId = orgId;
    }

    const [menus, total] = await Promise.all([
      prisma.menu.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              plan: true,
            },
          },
          _count: {
            select: {
              categories: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.menu.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        data: menus,
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

// Get menu by ID (with full details)
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true,
            status: true,
          },
        },
        categories: {
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!menu) {
      throw new NotFoundError('Menu not found');
    }

    res.json({ success: true, data: menu });
  } catch (error) {
    next(error);
  }
});

// Update menu
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, locale, isActive } = req.body;

    const menu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new NotFoundError('Menu not found');
    }

    const updated = await prisma.menu.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(locale && { locale }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    res.json({ success: true, data: updated, message: 'Menu updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete menu
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const menu = await prisma.menu.findUnique({
      where: { id },
    });

    if (!menu) {
      throw new NotFoundError('Menu not found');
    }

    // Delete menu (cascade will handle categories and items)
    await prisma.menu.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get menu statistics
router.get('/:id/stats', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            categories: true,
          },
        },
      },
    });

    if (!menu) {
      throw new NotFoundError('Menu not found');
    }

    const itemsCount = await prisma.menuItem.count({
      where: {
        category: {
          menuId: id,
        },
      },
    });

    const stats = {
      categoriesCount: menu._count.categories,
      itemsCount,
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

export default router;
