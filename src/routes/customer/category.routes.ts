/**
 * Category Routes
 */

import { Router } from 'express';
import { CategoryController } from '../../controllers/category.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createCategorySchema, updateCategorySchema, reorderCategoriesSchema } from '../../validators/category.validator.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/:menuId/categories', CategoryController.getAll);
router.get('/:menuId/categories/:categoryId', CategoryController.getById);
router.post('/:menuId/categories', requireRole(Role.EDITOR), validate(createCategorySchema), CategoryController.create);
router.put('/:menuId/categories/:categoryId', requireRole(Role.EDITOR), validate(updateCategorySchema), CategoryController.update);
router.delete('/:menuId/categories/:categoryId', requireRole(Role.ADMIN), CategoryController.delete);
router.post('/:menuId/categories/reorder', requireRole(Role.EDITOR), validate(reorderCategoriesSchema), CategoryController.reorder);

export default router;
