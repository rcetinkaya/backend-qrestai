/**
 * Category Service
 */

import { prisma } from '../config/database.js';
import { NotFoundError } from '../types/errors.js';

export class CategoryService {
  /**
   * Get all categories for a menu
   */
  static async getCategories(menuId: string, orgId: string) {
    // Verify menu belongs to org
    const menu = await prisma.menu.findFirst({
      where: { id: menuId, orgId },
    });

    if (!menu) {
      throw new NotFoundError('Menu');
    }

    return prisma.category.findMany({
      where: { menuId },
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(menuId: string, categoryId: string, orgId: string) {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        menuId,
        menu: { orgId },
      },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category');
    }

    return category;
  }

  /**
   * Create category
   */
  static async createCategory(
    menuId: string,
    orgId: string,
    data: { name: string; description?: string; sortOrder?: number }
  ) {
    // Verify menu belongs to org
    const menu = await prisma.menu.findFirst({
      where: { id: menuId, orgId },
    });

    if (!menu) {
      throw new NotFoundError('Menu');
    }

    // Get next sort order if not provided
    if (data.sortOrder === undefined) {
      const lastCategory = await prisma.category.findFirst({
        where: { menuId },
        orderBy: { sortOrder: 'desc' },
      });

      data.sortOrder = lastCategory ? lastCategory.sortOrder + 1 : 0;
    }

    return prisma.category.create({
      data: {
        ...data,
        menuId,
      },
    });
  }

  /**
   * Update category
   */
  static async updateCategory(
    menuId: string,
    categoryId: string,
    orgId: string,
    data: { name?: string; description?: string; sortOrder?: number }
  ) {
    // Verify category exists and belongs to org
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

    return prisma.category.update({
      where: { id: categoryId },
      data,
    });
  }

  /**
   * Delete category
   */
  static async deleteCategory(menuId: string, categoryId: string, orgId: string) {
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

    await prisma.category.delete({
      where: { id: categoryId },
    });
  }

  /**
   * Reorder categories
   */
  static async reorderCategories(menuId: string, orgId: string, categoryIds: string[]) {
    // Verify menu belongs to org
    const menu = await prisma.menu.findFirst({
      where: { id: menuId, orgId },
    });

    if (!menu) {
      throw new NotFoundError('Menu');
    }

    // Update sort order for each category
    await prisma.$transaction(
      categoryIds.map((id, index) =>
        prisma.category.updateMany({
          where: { id, menuId },
          data: { sortOrder: index },
        })
      )
    );
  }
}
