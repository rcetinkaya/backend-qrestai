/**
 * MenuItem Service
 */

import { prisma } from '../config/database.js';
import { NotFoundError } from '../types/errors.js';

export class MenuItemService {
  /**
   * Get all items for a category
   */
  static async getItems(menuId: string, categoryId: string, orgId: string) {
    // Verify category belongs to menu and org
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        menuId,
        menu: { orgId },
      },
    });

    if (!category) {
      throw new NotFoundError('Category');
    }

    return prisma.menuItem.findMany({
      where: { categoryId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get item by ID
   */
  static async getItemById(menuId: string, categoryId: string, itemId: string, orgId: string) {
    const item = await prisma.menuItem.findFirst({
      where: {
        id: itemId,
        categoryId,
        category: {
          menuId,
          menu: { orgId },
        },
      },
    });

    if (!item) {
      throw new NotFoundError('Menu item');
    }

    return item;
  }

  /**
   * Create menu item
   */
  static async createItem(
    menuId: string,
    categoryId: string,
    orgId: string,
    data: {
      name: string;
      description?: string;
      price: number;
      imageUrl?: string;
      isAvailable?: boolean;
      sortOrder?: number;
    }
  ) {
    // Verify category belongs to menu and org
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        menuId,
        menu: { orgId },
      },
    });

    if (!category) {
      throw new NotFoundError('Category');
    }

    // Get next sort order if not provided
    if (data.sortOrder === undefined) {
      const lastItem = await prisma.menuItem.findFirst({
        where: { categoryId },
        orderBy: { sortOrder: 'desc' },
      });

      data.sortOrder = lastItem ? lastItem.sortOrder + 1 : 0;
    }

    return prisma.menuItem.create({
      data: {
        ...data,
        categoryId,
      },
    });
  }

  /**
   * Update menu item
   */
  static async updateItem(
    menuId: string,
    categoryId: string,
    itemId: string,
    orgId: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      imageUrl?: string;
      isAvailable?: boolean;
      sortOrder?: number;
    }
  ) {
    // Verify item exists and belongs to org
    const item = await prisma.menuItem.findFirst({
      where: {
        id: itemId,
        categoryId,
        category: {
          menuId,
          menu: { orgId },
        },
      },
    });

    if (!item) {
      throw new NotFoundError('Menu item');
    }

    return prisma.menuItem.update({
      where: { id: itemId },
      data,
    });
  }

  /**
   * Delete menu item
   */
  static async deleteItem(menuId: string, categoryId: string, itemId: string, orgId: string) {
    const item = await prisma.menuItem.findFirst({
      where: {
        id: itemId,
        categoryId,
        category: {
          menuId,
          menu: { orgId },
        },
      },
    });

    if (!item) {
      throw new NotFoundError('Menu item');
    }

    await prisma.menuItem.delete({
      where: { id: itemId },
    });
  }

  /**
   * Reorder items
   */
  static async reorderItems(menuId: string, categoryId: string, orgId: string, itemIds: string[]) {
    // Verify category belongs to menu and org
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        menuId,
        menu: { orgId },
      },
    });

    if (!category) {
      throw new NotFoundError('Category');
    }

    // Update sort order for each item
    await prisma.$transaction(
      itemIds.map((id, index) =>
        prisma.menuItem.updateMany({
          where: { id, categoryId },
          data: { sortOrder: index },
        })
      )
    );
  }
}
