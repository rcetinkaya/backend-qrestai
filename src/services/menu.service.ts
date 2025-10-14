/**
 * Menu Service
 * Business logic for menu operations
 */

import { prisma } from '../config/database.js';
import { NotFoundError } from '../types/errors.js';
import { PaginationUtils } from '../utils/pagination.js';
import { PaginationParams } from '../types/api.js';
import { QrCodeService } from './qrcode.service.js';

export class MenuService {
  /**
   * Get all menus for organization
   */
  static async getMenus(orgId: string, params?: PaginationParams) {
    const { skip, take } = PaginationUtils.getPaginationParams(params || {});

    const [menus, total] = await Promise.all([
      prisma.menu.findMany({
        where: {
          orgId,
          ...(params?.search && {
            name: {
              contains: params.search,
              mode: 'insensitive',
            },
          }),
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          qr: true,
          categories: {
            include: {
              _count: {
                select: { items: true },
              },
            },
          },
        },
      }),
      prisma.menu.count({
        where: {
          orgId,
          ...(params?.search && {
            name: {
              contains: params.search,
              mode: 'insensitive',
            },
          }),
        },
      }),
    ]);

    // Compute total item counts for each menu
    const menusWithCounts = menus.map((menu) => {
      const itemCount = menu.categories.reduce(
        (sum, category) => sum + category._count.items,
        0
      );
      const categoryCount = menu.categories.length;

      // Remove categories from response, only return counts
      const { categories, ...menuData } = menu;

      return {
        ...menuData,
        _count: {
          categories: categoryCount,
          items: itemCount,
        },
      };
    });

    return PaginationUtils.formatResponse(menusWithCounts, total, params || {});
  }

  /**
   * Get menu by ID
   */
  static async getMenuById(id: string, orgId: string) {
    const menu = await prisma.menu.findFirst({
      where: { id, orgId },
      include: {
        categories: {
          include: {
            items: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        qr: true,
      },
    });

    if (!menu) {
      throw new NotFoundError('Menu');
    }

    return menu;
  }

  /**
   * Create menu
   */
  static async createMenu(orgId: string, data: { name: string; locale?: string }) {
    // Create menu
    const menu = await prisma.menu.create({
      data: {
        ...data,
        orgId,
      },
    });

    // Auto-generate QR code for the menu
    try {
      await QrCodeService.generateQrCode(menu.id, orgId);
    } catch (error) {
      console.error('Failed to auto-generate QR code:', error);
      // Don't fail menu creation if QR generation fails
    }

    // Return menu with QR code included
    return prisma.menu.findFirst({
      where: { id: menu.id },
      include: {
        qr: true,
        _count: {
          select: { categories: true },
        },
      },
    });
  }

  /**
   * Update menu
   */
  static async updateMenu(
    id: string,
    orgId: string,
    data: { name?: string; locale?: string; isActive?: boolean }
  ) {
    // Check if menu exists and belongs to org
    const menu = await prisma.menu.findFirst({
      where: { id, orgId },
    });

    if (!menu) {
      throw new NotFoundError('Menu');
    }

    return prisma.menu.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete menu
   */
  static async deleteMenu(id: string, orgId: string) {
    // Check if menu exists and belongs to org
    const menu = await prisma.menu.findFirst({
      where: { id, orgId },
    });

    if (!menu) {
      throw new NotFoundError('Menu');
    }

    await prisma.menu.delete({
      where: { id },
    });
  }

  /**
   * Duplicate menu
   */
  static async duplicateMenu(id: string, orgId: string) {
    const originalMenu = await prisma.menu.findFirst({
      where: { id, orgId },
      include: {
        categories: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!originalMenu) {
      throw new NotFoundError('Menu');
    }

    // Create duplicate in transaction
    const newMenu = await prisma.$transaction(async (tx) => {
      const menu = await tx.menu.create({
        data: {
          name: `${originalMenu.name} (Copy)`,
          locale: originalMenu.locale,
          orgId,
        },
      });

      // Duplicate categories and items
      for (const category of originalMenu.categories) {
        const newCategory = await tx.category.create({
          data: {
            menuId: menu.id,
            name: category.name,
            description: category.description,
            sortOrder: category.sortOrder,
          },
        });

        // Duplicate items
        if (category.items.length > 0) {
          await tx.menuItem.createMany({
            data: category.items.map(item => ({
              categoryId: newCategory.id,
              name: item.name,
              description: item.description,
              price: item.price,
              imageUrl: item.imageUrl,
              isAvailable: item.isAvailable,
              sortOrder: item.sortOrder,
            })),
          });
        }
      }

      return menu;
    });

    // Auto-generate QR code for the duplicated menu
    try {
      await QrCodeService.generateQrCode(newMenu.id, orgId);
    } catch (error) {
      console.error('Failed to auto-generate QR code for duplicated menu:', error);
      // Don't fail duplication if QR generation fails
    }

    // Return menu with QR code included
    return prisma.menu.findFirst({
      where: { id: newMenu.id },
      include: {
        qr: true,
        _count: {
          select: { categories: true },
        },
      },
    });
  }
}
