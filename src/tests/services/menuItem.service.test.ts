/**
 * MenuItem Service Tests
 */

import { MenuItemService } from '../../services/menuItem.service.js';
import { TestDb } from '../helpers/testDb.js';
import { NotFoundError, AuthorizationError } from '../../types/errors.js';

describe('MenuItemService', () => {
  beforeEach(async () => {
    await TestDb.cleanup();
  });

  describe('createItem', () => {
    it('should create new menu item', async () => {
      const { menu, org } = await TestDb.createTestSetup();
      const category = await TestDb.createCategory(menu.id);

      const item = await MenuItemService.createItem(
        menu.id,
        category.id,
        org.id,
        {
          name: 'Grilled Salmon',
          price: 24.99,
          description: 'Fresh Atlantic salmon',
          isAvailable: true,
          sortOrder: 0,
        }
      );

      expect(item).toHaveProperty('id');
      expect(item.name).toBe('Grilled Salmon');
      expect(item.price).toBe(24.99);
      expect(item.description).toBe('Fresh Atlantic salmon');
      expect(item.isAvailable).toBe(true);
      expect(item.categoryId).toBe(category.id);
    });

    it('should throw error if category not found', async () => {
      const { menu, org } = await TestDb.createTestSetup();
      const nonExistentId = 'clz0000000000000000000000';

      await expect(
        MenuItemService.createItem(
          menu.id,
          nonExistentId,
          org.id,
          { name: 'Test Item', price: 10.0 }
        )
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error if category belongs to different org', async () => {
      const { menu } = await TestDb.createTestSetup();
      const category = await TestDb.createCategory(menu.id);
      const otherOrg = await TestDb.createOrganization({ slug: 'other-org' });

      await expect(
        MenuItemService.createItem(
          menu.id,
          category.id,
          otherOrg.id,
          { name: 'Test Item', price: 10.0 }
        )
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('updateItem', () => {
    it('should update menu item', async () => {
      const { menu, org } = await TestDb.createTestSetup();
      const category = await TestDb.createCategory(menu.id);
      const item = await TestDb.createMenuItem(category.id);

      const updated = await MenuItemService.updateItem(
        menu.id,
        category.id,
        item.id,
        org.id,
        {
          name: 'Updated Item',
          price: 29.99,
          isAvailable: false,
        }
      );

      expect(updated.name).toBe('Updated Item');
      expect(updated.price).toBe(29.99);
      expect(updated.isAvailable).toBe(false);
    });

    it('should throw error if item not found', async () => {
      const { menu, org } = await TestDb.createTestSetup();
      const category = await TestDb.createCategory(menu.id);
      const nonExistentId = 'clz0000000000000000000000';

      await expect(
        MenuItemService.updateItem(
          menu.id,
          category.id,
          nonExistentId,
          org.id,
          { name: 'Updated' }
        )
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteItem', () => {
    it('should delete menu item', async () => {
      const { menu, org } = await TestDb.createTestSetup();
      const category = await TestDb.createCategory(menu.id);
      const item = await TestDb.createMenuItem(category.id);

      await MenuItemService.deleteItem(
        menu.id,
        category.id,
        item.id,
        org.id
      );

      await expect(
        MenuItemService.getItemById(menu.id, category.id, item.id, org.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getItemById', () => {
    it('should return menu item', async () => {
      const { menu, org } = await TestDb.createTestSetup();
      const category = await TestDb.createCategory(menu.id);
      const item = await TestDb.createMenuItem(category.id, {
        name: 'Test Item',
        price: 15.99,
      });

      const result = await MenuItemService.getItemById(
        menu.id,
        category.id,
        item.id,
        org.id
      );

      expect(result.name).toBe('Test Item');
      expect(result.price).toBe(15.99);
    });
  });
});
