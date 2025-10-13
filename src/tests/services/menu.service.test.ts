/**
 * Menu Service Tests
 */

import { MenuService } from '../../services/menu.service.js';
import { TestDb } from '../helpers/testDb.js';
import { NotFoundError } from '../../types/errors.js';

describe('MenuService', () => {
  beforeEach(async () => {
    await TestDb.cleanup();
  });

  describe('getMenus', () => {
    it('should return paginated menus for organization', async () => {
      const org = await TestDb.createOrganization();
      await TestDb.createMenu(org.id, { name: 'Menu 1' });
      await TestDb.createMenu(org.id, { name: 'Menu 2' });

      const result = await MenuService.getMenus(org.id, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter menus by search term', async () => {
      const { org } = await TestDb.createTestSetup();
      await TestDb.createMenu(org.id, { name: 'Summer Menu' });
      await TestDb.createMenu(org.id, { name: 'Winter Menu' });

      const result = await MenuService.getMenus(org.id, { search: 'Summer' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Summer Menu');
    });
  });

  describe('getMenuById', () => {
    it('should return menu with categories and items', async () => {
      const { org } = await TestDb.createTestSetup();
      const menu = await TestDb.createMenu(org.id);
      const category = await TestDb.createCategory(menu.id);
      await TestDb.createMenuItem(category.id);

      const result = await MenuService.getMenuById(menu.id, org.id);

      expect(result.id).toBe(menu.id);
      expect(result.categories).toHaveLength(1);
      expect(result.categories[0].items).toHaveLength(1);
    });

    it('should throw error if menu not found', async () => {
      const { org } = await TestDb.createTestSetup();

      await expect(
        MenuService.getMenuById('nonexistent-id', org.id)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw error if menu belongs to different org', async () => {
      const { org: org1 } = await TestDb.createTestSetup();
      const org2 = await TestDb.createOrganization();
      const menu = await TestDb.createMenu(org1.id);

      await expect(
        MenuService.getMenuById(menu.id, org2.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('createMenu', () => {
    it('should create new menu', async () => {
      const { org } = await TestDb.createTestSetup();

      const menu = await MenuService.createMenu(org.id, {
        name: 'New Menu',
        locale: 'en',
      });

      expect(menu.name).toBe('New Menu');
      expect(menu.locale).toBe('en');
      expect(menu.orgId).toBe(org.id);
    });
  });

  describe('updateMenu', () => {
    it('should update menu', async () => {
      const { org } = await TestDb.createTestSetup();
      const menu = await TestDb.createMenu(org.id, { name: 'Old Name' });

      const updated = await MenuService.updateMenu(menu.id, org.id, {
        name: 'New Name',
        isActive: false,
      });

      expect(updated.name).toBe('New Name');
      expect(updated.isActive).toBe(false);
    });

    it('should throw error if menu not found', async () => {
      const { org } = await TestDb.createTestSetup();

      await expect(
        MenuService.updateMenu('nonexistent-id', org.id, { name: 'Test' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteMenu', () => {
    it('should delete menu', async () => {
      const { org } = await TestDb.createTestSetup();
      const menu = await TestDb.createMenu(org.id);

      await MenuService.deleteMenu(menu.id, org.id);

      await expect(
        MenuService.getMenuById(menu.id, org.id)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('duplicateMenu', () => {
    it('should duplicate menu with categories and items', async () => {
      const { org } = await TestDb.createTestSetup();
      const menu = await TestDb.createMenu(org.id, { name: 'Original' });
      const category = await TestDb.createCategory(menu.id, { name: 'Cat 1' });
      await TestDb.createMenuItem(category.id, { name: 'Item 1' });

      const duplicated = await MenuService.duplicateMenu(menu.id, org.id);

      expect(duplicated.name).toBe('Original (Copy)');
      expect(duplicated.id).not.toBe(menu.id);

      const duplicatedWithData = await MenuService.getMenuById(duplicated.id, org.id);
      expect(duplicatedWithData.categories).toHaveLength(1);
      expect(duplicatedWithData.categories[0].items).toHaveLength(1);
    });
  });
});
