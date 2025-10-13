/**
 * Category Service Tests
 */

import { CategoryService } from '../../services/category.service.js';
import { TestDb } from '../helpers/testDb.js';
import { NotFoundError, AuthorizationError } from '../../types/errors.js';

describe('CategoryService', () => {
  beforeEach(async () => {
    await TestDb.cleanup();
  });

  describe('createCategory', () => {
    it('should create new category', async () => {
      const { menu, org } = await TestDb.createTestSetup();

      const category = await CategoryService.createCategory(
        menu.id,
        org.id,
        {
          name: 'Appetizers',
          description: 'Start your meal',
          sortOrder: 0,
        }
      );

      expect(category).toHaveProperty('id');
      expect(category.name).toBe('Appetizers');
      expect(category.description).toBe('Start your meal');
      expect(category.sortOrder).toBe(0);
      expect(category.menuId).toBe(menu.id);
    });

    it('should throw error if menu not found', async () => {
      const org = await TestDb.createOrganization();
      const nonExistentMenuId = 'clz0000000000000000000000';

      await expect(
        CategoryService.createCategory(
          nonExistentMenuId,
          org.id,
          { name: 'Test Category', sortOrder: 0 }
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error if menu belongs to different org', async () => {
      const { menu } = await TestDb.createTestSetup();
      const otherOrg = await TestDb.createOrganization({ slug: 'other-org' });

      await expect(
        CategoryService.createCategory(
          menu.id,
          otherOrg.id,
          { name: 'Test Category', sortOrder: 0 }
        )
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('updateCategory', () => {
    it('should update category', async () => {
      const { menu, org } = await TestDb.createTestSetup();
      const category = await TestDb.createCategory(menu.id);

      const updated = await CategoryService.updateCategory(
        menu.id,
        category.id,
        org.id,
        {
          name: 'Updated Category',
          description: 'New description',
        }
      );

      expect(updated.name).toBe('Updated Category');
      expect(updated.description).toBe('New description');
    });

    it('should throw error if category not found', async () => {
      const { menu, org } = await TestDb.createTestSetup();
      const nonExistentId = 'clz0000000000000000000000';

      await expect(
        CategoryService.updateCategory(
          menu.id,
          nonExistentId,
          org.id,
          { name: 'Updated' }
        )
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteCategory', () => {
    it('should delete category', async () => {
      const { menu, org } = await TestDb.createTestSetup();
      const category = await TestDb.createCategory(menu.id);

      await CategoryService.deleteCategory(menu.id, category.id, org.id);

      await expect(
        CategoryService.getCategoryById(menu.id, category.id, org.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getCategoryById', () => {
    it('should return category with items', async () => {
      const { menu, org } = await TestDb.createTestSetup();
      const category = await TestDb.createCategory(menu.id);
      await TestDb.createMenuItem(category.id);

      const result = await CategoryService.getCategoryById(
        menu.id,
        category.id,
        org.id
      );

      expect(result).toHaveProperty('items');
      expect(result.items).toHaveLength(1);
    });
  });
});
