/**
 * MenuItem Routes
 */

import { Router } from 'express';
import { MenuItemController } from '../../controllers/menuItem.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createMenuItemSchema, updateMenuItemSchema, reorderItemsSchema } from '../../validators/menuItem.validator.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/:menuId/categories/:categoryId/items', MenuItemController.getAll);
router.get('/:menuId/categories/:categoryId/items/:itemId', MenuItemController.getById);
router.post('/:menuId/categories/:categoryId/items', requireRole(Role.EDITOR), validate(createMenuItemSchema), MenuItemController.create);
router.put('/:menuId/categories/:categoryId/items/:itemId', requireRole(Role.EDITOR), validate(updateMenuItemSchema), MenuItemController.update);
router.delete('/:menuId/categories/:categoryId/items/:itemId', requireRole(Role.ADMIN), MenuItemController.delete);
router.post('/:menuId/categories/:categoryId/items/reorder', requireRole(Role.EDITOR), validate(reorderItemsSchema), MenuItemController.reorder);

export default router;
