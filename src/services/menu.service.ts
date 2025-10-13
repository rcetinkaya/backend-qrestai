/**
 * Menu Service
 * Business logic for menu operations
 */

import { prisma } from '../config/database.js';
import { NotFoundError } from '../types/errors.js';
import { PaginationUtils } from '../utils/pagination.js';
import { PaginationParams } from '../types/api.js';

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
          _count: {
            select: { categories: true },
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

    return PaginationUtils.formatResponse(menus, total, params || {});
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
    return prisma.menu.create({
      data: {
        ...data,
        orgId,
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
    return prisma.$transaction(async (tx) => {
      const newMenu = await tx.menu.create({
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
            menuId: newMenu.id,
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

      return newMenu;
    });
  }
}
